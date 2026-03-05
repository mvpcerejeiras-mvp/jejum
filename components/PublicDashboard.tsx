import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { getPrayerCampaigns, getPrayerSignups } from '../services/db';
import { PrayerCampaign, PrayerSignup } from '../types';
import { Clock, Users, Calendar, Activity, Sparkles, Trophy } from 'lucide-react';

export default function PublicDashboard() {
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
        if (!campaign) return { total: 0, currentSlot: null, nextSlot: null, progress: 0 };

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

        return {
            total,
            currentSlotIndex,
            currentSlotCount,
            slotCounts,
            progress
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
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-20 overflow-x-hidden">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="max-w-6xl mx-auto px-4 pt-12 relative z-10">

                {/* Header Section */}
                <div className="text-center mb-12 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        <span className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Painel Público Ao Vivo</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                        {campaign.title}
                    </h1>
                    <div className="flex flex-wrap justify-center gap-4 text-slate-400 font-medium">
                        <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/5">
                            <Calendar size={16} className="text-indigo-500" />
                            <span>Início: {new Date(campaign.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/5">
                            <Clock size={16} className="text-indigo-500" />
                            <span>Duração: {campaign.duration} Horas</span>
                        </div>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

                    {/* Status Agora */}
                    <div className="md:col-span-2 bg-slate-900/40 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Activity size={80} className="text-indigo-500" />
                        </div>
                        <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-6">Intercessão Agora</h3>

                        <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4 mb-8">
                            <span className="text-7xl md:text-8xl font-black text-white tracking-tighter">
                                {stats.currentSlotCount}
                            </span>
                            <span className="text-xl md:text-2xl font-bold text-slate-500 mb-2 md:mb-4">irmãos em oração</span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold">
                                <span className="text-slate-400 uppercase tracking-wider">Cobertura Geral</span>
                                <span className="text-indigo-400">{stats.progress}%</span>
                            </div>
                            <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden p-0.5 border border-white/5">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                                    style={{ width: `${stats.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Total Acumulado */}
                    <div className="bg-indigo-600 p-8 rounded-[2rem] shadow-2xl shadow-indigo-600/20 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform">
                            <Trophy size={140} />
                        </div>
                        <h3 className="text-indigo-200 text-xs font-black uppercase tracking-widest">Total de Inscrições</h3>
                        <div>
                            <div className="text-7xl font-black text-white tracking-tighter mb-2">
                                {stats.total}
                            </div>
                            <p className="text-indigo-100 font-medium">Intercessores mobilizados até agora</p>
                        </div>
                        <div className="mt-8 bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Sparkles size={20} className="text-white" />
                                </div>
                                <span className="text-sm font-bold text-white">Mobilização Intensa!</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Density Grid */}
                <div className="bg-slate-900/40 backdrop-blur-md p-8 rounded-[2rem] border border-white/10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400 border border-indigo-500/20">
                                <Users size={20} />
                            </div>
                            <h3 className="font-bold text-lg">Distribuição de Escala</h3>
                        </div>
                        <div className="hidden sm:flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-800"></div> <span className="text-slate-500">Vagas</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> <span className="text-slate-500">Ocultação</span></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-3">
                        {stats.slotCounts.map((slot, i) => {
                            const isCurrent = stats.currentSlotIndex === i;
                            const isFilled = slot.count >= 7;
                            const isMaxed = slot.count >= 10;

                            let bgColor = "bg-slate-900/50 border-white/5";
                            let textColor = "text-slate-500";
                            let iconColor = "text-slate-700";

                            if (isCurrent) {
                                bgColor = "bg-indigo-600 border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.3)] ring-2 ring-indigo-400/20 ring-offset-4 ring-offset-slate-950";
                                textColor = "text-white";
                                iconColor = "text-indigo-200";
                            } else if (isFilled) {
                                bgColor = "bg-indigo-500/20 border-indigo-500/30";
                                textColor = "text-indigo-300";
                                iconColor = "text-indigo-500/50";
                            }

                            return (
                                <div
                                    key={i}
                                    className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-500 group ${bgColor}`}
                                >
                                    <span className={`text-[10px] font-black uppercase mb-1 ${textColor} opacity-60`}>
                                        {formatTime(slot.index)}
                                    </span>
                                    <span className={`text-2xl font-black ${textColor} tracking-tighter`}>
                                        {slot.count}
                                    </span>

                                    {isCurrent && (
                                        <div className="absolute -top-1 -right-1">
                                            <span className="flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Message */}
                <div className="mt-12 text-center">
                    <p className="text-slate-500 font-medium italic">
                        "E, tudo o que pedirdes em oração, crendo, o recebereis." — Mateus 21:22
                    </p>
                </div>

            </div>
        </div>
    );
}
