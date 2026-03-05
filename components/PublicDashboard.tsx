import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { getPrayerCampaigns, getPrayerSignups } from '../services/db';
import { PrayerCampaign, PrayerSignup } from '../types';
import { Clock, Users, Calendar, Activity, Sparkles, Trophy, MousePointer2 } from 'lucide-react';

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
        if (!campaign) return { total: 0, currentSlotIndex: -1, currentSlotCount: 0, slotCounts: [], progress: 0, timeLeft: { h: '00', m: '00', s: '00' }, preStartCount: null };

        const total = signups.length;
        const slots = Array.from({ length: campaign.duration }, (_, i) => i);

        // Find current slot based on startDate
        const start = new Date(campaign.startDate);
        const diffMs = currentTime.getTime() - start.getTime();
        const diffHoursRaw = diffMs / (1000 * 60 * 60);
        const diffHours = Math.floor(diffHoursRaw);

        // Se a campanha ainda não começou
        const isPreStart = diffMs < 0;
        let preStartCount = null;

        if (isPreStart) {
            const absMs = Math.abs(diffMs);
            const d = Math.floor(absMs / (1000 * 60 * 60 * 24));
            const h = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((absMs % (1000 * 60)) / 1000);
            preStartCount = { d, h, m, s };
        }

        const currentSlotIndex = (diffHours >= 0 && diffHours < campaign.duration) ? diffHours : -1;

        const slotCounts = slots.map(s => {
            const count = signups.filter(su => su.slotNumber === s).length;
            // Lógica de Vagas Dinâmicas: Começa em 5, aumenta +3 sempre que lotar
            const baseCapacity = 5;
            let capacity = baseCapacity;
            while (count >= capacity) {
                capacity += 3;
            }
            return {
                index: s,
                count,
                capacity,
                isFull: false // Removido o conceito de "bloqueado", agora sempre abre +3
            };
        });

        const currentSlotCount = currentSlotIndex !== -1 ? slotCounts[currentSlotIndex].count : 0;

        // Progress based on an arbitrary "mobilization goal"
        const baseGoal = campaign.duration * 5;
        const progress = Math.min(Math.round((total / baseGoal) * 100), 100);

        // Countdown to next slot
        let timeLeft = { h: '00', m: '00', s: '00' };
        if (currentSlotIndex !== -1) {
            const nextSlotTime = new Date(start);
            nextSlotTime.setHours(start.getHours() + currentSlotIndex + 1);
            const remainingMs = nextSlotTime.getTime() - currentTime.getTime();

            if (remainingMs > 0) {
                const h = Math.floor(remainingMs / (1000 * 60 * 60));
                const m = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((remainingMs % (1000 * 60)) / 1000);
                timeLeft = {
                    h: h.toString().padStart(2, '0'),
                    m: m.toString().padStart(2, '0'),
                    s: s.toString().padStart(2, '0')
                };
            }
        }

        return {
            total,
            currentSlotIndex,
            currentSlotCount,
            slotCounts,
            progress,
            timeLeft,
            preStartCount
        };
    }, [campaign, signups, currentTime]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center justify-center text-white p-4">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-indigo-400/60 font-black uppercase tracking-[0.2em] text-xs">Sincronizando Relógio...</p>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center justify-center text-white p-4 text-center">
                <div className="bg-slate-900/50 backdrop-blur-xl p-12 rounded-[3rem] border border-white/5 shadow-2xl max-w-md">
                    <Clock className="w-16 h-16 text-indigo-500 mx-auto mb-6 opacity-20" />
                    <h2 className="text-3xl font-black mb-4 tracking-tighter">Fique Atento!</h2>
                    <p className="text-slate-500 font-bold">No momento não temos nenhuma campanha de intercessão aberta. Acompanhe nossos comunicados!</p>
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
        <div className="min-h-screen bg-[#08090d] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-32 overflow-x-hidden">
            {/* Ambient Lighting */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-indigo-600/15 blur-[160px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[160px] rounded-full"></div>
                <div className="absolute top-[20%] left-[-20%] w-[50%] h-[50%] bg-blue-600/10 blur-[130px] rounded-full"></div>
                <div className="absolute bottom-[20%] right-[-20%] w-[40%] h-[40%] bg-emerald-600/5 blur-[130px] rounded-full"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pt-16 relative z-10">

                {/* Header Section */}
                <div className="text-center mb-20 animate-fade-in">
                    <div className="inline-flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 px-6 py-2 rounded-full mb-8 backdrop-blur-md">
                        <Sparkles size={14} className="text-indigo-400" />
                        <span className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em]">Propósito Congregacional Live</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-[0.9] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/30">
                        {campaign.title}
                    </h1>

                    <div className="flex flex-wrap justify-center gap-6 mt-8">
                        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 shadow-xl">
                            <Calendar size={18} className="text-indigo-400" />
                            <span className="font-black text-sm uppercase tracking-wider">Início: {new Date(campaign.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 shadow-xl">
                            <Clock size={18} className="text-indigo-400" />
                            <span className="font-black text-sm uppercase tracking-wider">{campaign.duration} Horas de Chamado</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">

                    {/* Countdown / Current Status Card */}
                    <div className="lg:col-span-8 space-y-8">
                        {stats.preStartCount ? (
                            /* PRE-START COUNTDOWN - AS PER ATTACHMENT */
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-2xl p-12 rounded-[3.5rem] border border-white/10 shadow-2xl relative overflow-hidden group border-b-8 border-indigo-500/20">
                                <div className="text-center relative z-10">
                                    <h3 className="text-indigo-400 text-xs font-black uppercase tracking-[0.4em] mb-12">O Clamor Começa Em</h3>

                                    <div className="flex justify-center gap-4 md:gap-8">
                                        {[
                                            { label: 'DIAS', val: stats.preStartCount.d },
                                            { label: 'HORAS', val: stats.preStartCount.h },
                                            { label: 'MIN', val: stats.preStartCount.m },
                                            { label: 'SEG', val: stats.preStartCount.s }
                                        ].map((unit, i) => (
                                            <div key={i} className="flex flex-col items-center gap-4">
                                                <div className="w-20 h-20 md:w-28 md:h-28 bg-[#1a1c26]/80 flex items-center justify-center rounded-[1.5rem] md:rounded-[2rem] border border-white/10 shadow-inner group-hover:border-indigo-500/30 transition-all duration-500 backdrop-blur-md">
                                                    <span className="text-4xl md:text-5xl font-black text-white tabular-nums drop-shadow-2xl">
                                                        {unit.val.toString().padStart(2, '0')}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-500 tracking-[0.2em]">{unit.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* LIVE STATUS - DURING CAMPAIGN */
                            <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-2xl p-12 rounded-[3.5rem] border border-white/10 shadow-2xl relative overflow-hidden group border-b-8 border-indigo-500/20">
                                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-all duration-1000">
                                    <Activity size={180} className="text-indigo-400" />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-10">
                                        <div className="flex h-3 w-3 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                        </div>
                                        <h3 className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">Intercessão em Tempo Real</h3>
                                    </div>

                                    <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-8 mb-12">
                                        <span className="text-9xl md:text-[12rem] font-black text-white tracking-tighter leading-[0.85] drop-shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                                            {stats.currentSlotCount}
                                        </span>
                                        <div className="mb-6">
                                            <h4 className="text-3xl font-black text-white/90 tracking-tight">Vozes Unidas</h4>
                                            <p className="text-xl font-bold text-indigo-400/60 tracking-tight">nesta hora de clamor</p>
                                        </div>
                                    </div>

                                    {/* TURN COUNTDOWN */}
                                    <div className="bg-indigo-500/5 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-2xl flex items-center justify-between group-hover:border-indigo-500/20 transition-all duration-500 shadow-inner">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                                                <Clock size={32} className="text-indigo-400 animate-pulse" />
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Próxima Troca de Turno</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-mono font-black text-white tabular-nums tracking-wider">{stats.timeLeft.h}:{stats.timeLeft.m}:{stats.timeLeft.s}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="hidden sm:block">
                                            <div className="px-4 py-2 bg-white/5 rounded-full border border-white/5 text-[9px] font-black text-indigo-400/50 uppercase tracking-widest backdrop-blur-md">Cloud Sync Enabled</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Progress Bar - Large & Premium */}
                        <div className="bg-slate-900/40 backdrop-blur-xl p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <Trophy size={20} className="text-indigo-400" />
                                    <h5 className="font-black text-sm uppercase tracking-widest text-slate-300">Nível de Mobilização</h5>
                                </div>
                                <span className="text-2xl font-black text-indigo-400 tabular-nums">{stats.progress}%</span>
                            </div>
                            <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5 shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-700 via-indigo-400 to-indigo-600 rounded-full transition-all duration-1000 relative shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                                    style={{ width: `${stats.progress}%` }}
                                >
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                    <div className="absolute top-0 bottom-0 right-0 w-8 bg-white/30 blur-md"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary & Action Cards */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-12 rounded-[3.5rem] shadow-2xl shadow-indigo-600/20 relative overflow-hidden group flex-1 flex flex-col justify-between">
                            <div className="absolute top-[-5%] right-[-5%] opacity-10 transform -rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                                <Sparkles size={240} className="text-white" />
                            </div>

                            <div>
                                <h3 className="text-indigo-200 text-xs font-black uppercase tracking-[0.3em] mb-12">Total de Intercessores</h3>
                                <div className="text-9xl font-black text-white racking-tighter mb-4 drop-shadow-2xl">
                                    {stats.total}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <p className="text-lg font-bold text-indigo-100/70 leading-tight">Uma igreja que ora é uma igreja vitoriosa.</p>
                                <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
                                    <div className="flex items-center gap-4">
                                        <Users className="text-white" size={24} />
                                        <span className="text-xs font-black uppercase tracking-widest text-white">Mobilização Geral</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* JOIN CTA - HIGH CONTRAST */}
                        <button
                            onClick={onJoin}
                            className="bg-white hover:bg-slate-100 text-[#0a0c10] p-10 rounded-[3rem] shadow-2xl flex items-center justify-between group transition-all duration-500 transform hover:scale-[1.02] active:scale-95 border-b-[12px] border-slate-300"
                        >
                            <div className="text-left">
                                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-2">Engaje-se Agora</span>
                                <h4 className="text-4xl font-black tracking-tighter">Quero Participar</h4>
                            </div>
                            <div className="w-20 h-20 bg-[#0a0c10] text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl group-hover:bg-indigo-600 transition-colors group-hover:rotate-12 transform">
                                <MousePointer2 size={32} />
                            </div>
                        </button>
                    </div>
                </div>

                {/* DENSITY GRID - PREMIUM REWORK */}
                <div className="bg-gradient-to-b from-slate-900/60 to-slate-950/80 backdrop-blur-2xl p-12 rounded-[4rem] border border-white/10 shadow-3xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                                <Activity size={32} />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black tracking-tighter">Distribuição de Escala</h3>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Monitoramento Detalhado de Ocupação</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-8 bg-black/40 p-5 px-10 rounded-full border border-white/10 backdrop-blur-3xl shadow-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-slate-800 border border-white/10"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Livre</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Última Vaga</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Em Foco</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-4">
                        {stats.slotCounts.map((slot, i) => {
                            const isCurrent = stats.currentSlotIndex === i;
                            const isFilling = slot.count < slot.capacity && slot.count > 0;
                            const isAlmostFull = slot.count >= slot.capacity - 1;
                            const isFull = slot.count >= slot.capacity;

                            let cardClass = "bg-slate-900/40 border-white/5 hover:border-white/10 hover:bg-slate-900/60 transition-transform duration-500 hover:scale-105";
                            let iconColor = "text-slate-700";
                            let countColor = "text-slate-500";
                            let statusText = "Livre";

                            if (isCurrent) {
                                cardClass = "bg-indigo-600 border-indigo-400 shadow-[0_0_50px_rgba(79,70,229,0.4)] ring-2 ring-white/20 animate-pulse-slow";
                                iconColor = "text-indigo-100";
                                countColor = "text-white";
                                statusText = "AGORA";
                            } else if (isAlmostFull) {
                                cardClass = "bg-amber-500/10 border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)]";
                                iconColor = "text-amber-400/50";
                                countColor = "text-amber-400";
                                statusText = "1 Vaga Restante";
                            } else if (isFilling) {
                                cardClass = "bg-indigo-500/5 border-indigo-500/10 hover:border-indigo-500/30 shadow-inner";
                                iconColor = "text-indigo-400/40";
                                countColor = "text-indigo-300/80";
                                statusText = `${slot.capacity - slot.count} Vagas`;
                            }

                            return (
                                <div
                                    key={i}
                                    style={{ animationDelay: `${i * 30}ms` }}
                                    className={`relative p-6 rounded-[2.5rem] border flex flex-col items-center justify-center gap-3 group overflow-hidden cursor-default animate-fade-in-up ${cardClass}`}
                                >
                                    {/* Abstract background pattern for premium feel */}
                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] group-hover:opacity-[0.05] transition-opacity"></div>

                                    {/* Glass reflection */}
                                    <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/10 to-transparent skew-y-[-10deg] transform -translate-y-10 group-hover:translate-y-[-20%] transition-transform duration-1000"></div>

                                    <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${iconColor}`}>
                                        {formatTime(slot.index)}
                                    </span>

                                    <div className="relative">
                                        <span className={`text-4xl font-black transition-colors tabular-nums tracking-tighter ${countColor}`}>
                                            {slot.count}
                                        </span>
                                        <span className={`text-[10px] font-bold absolute -right-5 top-0 opacity-20 ${countColor}`}>/ {slot.capacity}</span>
                                    </div>

                                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-current opacity-40 ${iconColor}`}>
                                        {statusText}
                                    </span>

                                    {isCurrent && (
                                        <div className="absolute top-4 right-4">
                                            <span className="flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                            </span>
                                        </div>
                                    )}

                                    {/* Hover glow effect */}
                                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.02] transition-colors duration-500"></div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-12 flex items-center justify-center gap-4 bg-white/5 p-6 rounded-[2rem] border border-white/5">
                        <Sparkles size={20} className="text-amber-400" />
                        <p className="text-slate-400 text-sm font-bold">
                            Lógica de Vagas Dinâmicas ativa: O sistema abre <span className="text-indigo-400">+3 vagas</span> automaticamente sob demanda.
                        </p>
                    </div>
                </div>

                {/* Footer Quote */}
                <div className="mt-20 text-center animate-fade-in pb-10">
                    <p className="text-slate-500 font-black italic text-base tracking-tight opacity-40 max-w-2xl mx-auto leading-relaxed">
                        "Se o meu povo, que se chama pelo meu nome, se humilhar e orar, buscar a minha face e se afastar dos seus maus caminhos, dos céus o ouvirei, perdoarei o seu pecado e curarei a sua terra."
                        <span className="block mt-4 text-[10px] font-black not-italic tracking-[0.3em] uppercase opacity-50">2 Crônicas 7:14</span>
                    </p>
                </div>

            </div>
        </div>
    );
}
