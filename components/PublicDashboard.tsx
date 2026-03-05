import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { getPrayerCampaigns, getPrayerSignups } from '../services/db';
import { PrayerCampaign, PrayerSignup } from '../types';
import { Clock, Users, Calendar, Activity, Sparkles, Trophy } from 'lucide-react';

interface PublicDashboardProps {
    onJoin?: () => void;
}

export default function PublicDashboard({ onJoin }: PublicDashboardProps) {
    const [campaign, setCampaign] = useState<PrayerCampaign | null>(null);
    const [signups, setSignups] = useState<PrayerSignup[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        loadData();

        // Update current time every second for the "live" feel
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        // REALTIME: Listen for changes in signup table
        const channel = supabase
            .channel('public_prayer_dashboard')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'prayer_signups' },
                () => {
                    console.log('Dados atualizados via Realtime!');
                    loadData(false); // Refresh data without showing main loader
                }
            )
            .subscribe();

        return () => {
            clearInterval(timer);
            supabase.removeChannel(channel);
        };
    }, []);

    const loadData = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const campaigns = await getPrayerCampaigns();
            const active = campaigns.find(c => c.isActive);

            setCampaign(active || null);
            if (active) {
                const data = await getPrayerSignups(active.id);
                setSignups(data);
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    // Memoized stats
    const stats = useMemo(() => {
        if (!campaign) return { total: 0, currentSlotIndex: -1, currentSlotCount: 0, slotCounts: [], progress: 0, timeLeft: '' };

        const total = signups.length;
        const slots = Array.from({ length: campaign.duration }, (_, i) => i);

        // Find current slot based on startDate
        const start = new Date(campaign.startDate);
        const diffMs = currentTime.getTime() - start.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        const currentSlotIndex = (diffHours >= 0 && diffHours < campaign.duration) ? diffHours : -1;

        const slotCounts = slots.map(s => ({
            index: s,
            count: signups.filter(su => su.slotNumber === s).length
        }));

        const currentSlotCount = currentSlotIndex !== -1 ? slotCounts[currentSlotIndex].count : 0;

        // Progress based on total capacity (assuming 7 as base goal per slot)
        const baseGoal = campaign.duration * 7;
        const progress = Math.min(Math.round((total / baseGoal) * 100), 100);

        // Countdown to next slot
        let timeLeft = '--:--:--';
        if (currentSlotIndex !== -1 || diffHours < 0) {
            const nextSlotTime = new Date(start);
            nextSlotTime.setHours(start.getHours() + (diffHours < 0 ? 0 : currentSlotIndex + 1));
            const remainingMs = nextSlotTime.getTime() - currentTime.getTime();

            if (remainingMs > 0) {
                const h = Math.floor(remainingMs / (1000 * 60 * 60));
                const m = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((remainingMs % (1000 * 60)) / 1000);
                timeLeft = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
        }

        return {
            total,
            currentSlotIndex,
            currentSlotCount,
            slotCounts,
            progress,
            timeLeft
        };
    }, [campaign, signups, currentTime]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 font-medium animate-pulse">Sincronizando Relógio de Oração...</p>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 text-center">
                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl max-w-md">
                    <Clock className="w-16 h-16 text-indigo-500 mx-auto mb-4 opacity-50" />
                    <h2 className="text-2xl font-bold mb-2">Sem Campanhas Ativas</h2>
                    <p className="text-slate-400">No momento não há nenhum Relógio de Oração em andamento. Volte em breve!</p>
                </div>
            </div>
        );
    }

    const formatTime = (slot: number) => {
        const date = new Date(campaign.startDate);
        date.setHours(date.getHours() + slot);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-[#0a0c10] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-20 overflow-x-hidden">
            {/* Ambient Background Elements - Enhanced for better light/glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-indigo-500/20 blur-[150px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-500/15 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-blue-500/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="max-w-6xl mx-auto px-4 pt-12 relative z-10">

                {/* Header Section */}
                <div className="text-center mb-16 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 px-5 py-2 rounded-full mb-8 backdrop-blur-md">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-400"></span>
                        </span>
                        <span className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.3em]">Painel Público de Intercessão</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-indigo-200/50">
                            {campaign.title}
                        </span>
                    </h1>

                    <div className="flex flex-wrap justify-center gap-4 text-slate-300">
                        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10 shadow-lg">
                            <Calendar size={18} className="text-indigo-400" />
                            <span className="font-bold text-sm">Início: {new Date(campaign.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10 shadow-lg">
                            <Clock size={18} className="text-indigo-400" />
                            <span className="font-bold text-sm">Escala de {campaign.duration} Horas</span>
                        </div>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">

                    {/* Status Agora - Enhanced Glow and Typography */}
                    <div className="md:col-span-2 bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-all duration-700 transform group-hover:rotate-12 group-hover:scale-110">
                            <Activity size={100} className="text-indigo-400" />
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-indigo-400/80 text-[10px] font-black uppercase tracking-[0.2em] mb-8">Status da Intercessão</h3>

                            <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-6 mb-12">
                                <span className="text-8xl md:text-[10rem] font-black text-white tracking-tighter leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]">
                                    {stats.currentSlotCount}
                                </span>
                                <div className="mb-4">
                                    <span className="block text-2xl md:text-3xl font-black text-white/90">Intercessores</span>
                                    <span className="text-lg font-bold text-indigo-400/60">nesta hora</span>
                                </div>
                            </div>

                            {/* Cronômetro Regressivo */}
                            <div className="mb-10 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6 backdrop-blur-md flex items-center justify-between group-hover:border-indigo-500/40 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-500/20 rounded-2xl">
                                        <Clock size={24} className="text-indigo-300 animate-pulse" />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-black text-indigo-300/60 uppercase tracking-widest">Próxima Troca em</span>
                                        <span className="text-3xl font-mono font-black text-white tabular-nums tracking-wider">{stats.timeLeft}</span>
                                    </div>
                                </div>
                                <div className="hidden sm:block">
                                    <span className="text-xs font-bold text-indigo-300/40 px-4 py-2 bg-white/5 rounded-full border border-white/5 uppercase tracking-widest">Live Sync</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm font-black">
                                    <span className="text-slate-400 uppercase tracking-[0.1em]">Cobertura do Propósito</span>
                                    <span className="text-indigo-400">{stats.progress}%</span>
                                </div>
                                <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden p-1 border border-white/10 shadow-inner">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-600 via-indigo-400 to-indigo-300 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(79,70,229,0.5)] relative"
                                        style={{ width: `${stats.progress}%` }}
                                    >
                                        <div className="absolute top-0 bottom-0 right-0 w-2 bg-white/30 blur-sm"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total & Action Card */}
                    <div className="flex flex-col gap-6">
                        {/* Total Acumulado - More Vibrant */}
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-10 rounded-[3rem] shadow-2xl shadow-indigo-600/30 flex flex-col justify-between relative overflow-hidden group flex-1">
                            <div className="absolute -right-6 -top-6 opacity-20 transform -rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-all duration-700">
                                <Trophy size={160} />
                            </div>
                            <h3 className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] relative z-10">Total de Inscrições</h3>
                            <div className="relative z-10">
                                <div className="text-8xl font-black text-white tracking-tighter mb-2 drop-shadow-xl">
                                    {stats.total}
                                </div>
                                <p className="text-indigo-100/80 font-bold leading-tight">Mãos levantadas em favor da igreja</p>
                            </div>
                            <div className="mt-8 bg-white/20 backdrop-blur-lg rounded-2xl p-5 border border-white/20 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-white/30 rounded-xl">
                                        <Sparkles size={24} className="text-white shadow-xl" />
                                    </div>
                                    <span className="text-sm font-black text-white uppercase tracking-wider">Mobilização Especial</span>
                                </div>
                            </div>
                        </div>

                        {/* Quero Participar CTA */}
                        <button
                            onClick={onJoin}
                            className="bg-white hover:bg-slate-100 text-indigo-900 p-8 rounded-[2.5rem] shadow-2xl flex items-center justify-between group transition-all duration-300 transform hover:scale-[1.02] active:scale-95 border-b-8 border-slate-300"
                        >
                            <div className="text-left">
                                <span className="block text-[10px] font-black uppercase tracking-widest text-indigo-600/50 mb-1">Deseja participar?</span>
                                <span className="text-2xl font-black tracking-tight">Quero Participar</span>
                            </div>
                            <div className="bg-indigo-600 group-hover:bg-indigo-700 p-4 rounded-2xl text-white transition-colors shadow-lg">
                                <Users size={28} />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Density Grid - Cleaner and more professional */}
                <div className="bg-slate-900/40 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 shadow-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                                <Users size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-xl tracking-tight">Distribuição de Escala</h3>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Monitoramento de Ocupação</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 bg-white/5 py-3 px-6 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-white/10"></div> <span>Aberta</span></div>
                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div> <span>Preenchida</span></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-3">
                        {stats.slotCounts.map((slot, i) => {
                            const isCurrent = stats.currentSlotIndex === i;
                            const isFilled = slot.count >= 7;

                            let bgColor = "bg-slate-900/30 border-white/5 hover:border-white/10";
                            let textColor = "text-slate-500";

                            if (isCurrent) {
                                bgColor = "bg-indigo-500 border-indigo-300 shadow-[0_0_25px_rgba(79,70,229,0.4)]";
                                textColor = "text-white";
                            } else if (isFilled) {
                                bgColor = "bg-indigo-500/10 border-indigo-500/20";
                                textColor = "text-indigo-400";
                            }

                            return (
                                <div
                                    key={i}
                                    className={`relative flex flex-col items-center justify-center py-5 px-2 rounded-3xl border transition-all duration-500 group cursor-default ${bgColor}`}
                                >
                                    <span className={`text-[9px] font-black uppercase mb-1.5 transition-colors ${textColor} opacity-60`}>
                                        {formatTime(slot.index)}
                                    </span>
                                    <span className={`text-2xl font-black transition-colors ${textColor} tracking-tight`}>
                                        {slot.count}
                                    </span>

                                    {isCurrent && (
                                        <div className="absolute -top-1.5 -right-1.5">
                                            <span className="flex h-4 w-4">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40"></span>
                                                <span className="relative inline-flex rounded-full h-4 w-4 bg-white shadow-xl"></span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Message */}
                <div className="mt-16 text-center animate-fade-in">
                    <p className="text-slate-500 font-bold italic text-sm tracking-wide opacity-80">
                        "E, tudo o que pedirdes em oração, crendo, o recebereis." — Mateus 21:22
                    </p>
                </div>

            </div>
        </div>
    );
}
