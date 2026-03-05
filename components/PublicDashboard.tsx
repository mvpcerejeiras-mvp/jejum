import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { getPrayerCampaigns, getPrayerSignups } from '../services/db';
import { PrayerCampaign, PrayerSignup } from '../types';
import { Clock, Users, Calendar, Activity, Sparkles, Trophy, MousePointer2, AlertCircle } from 'lucide-react';
import { PRAYER_SLOT_NAMES } from '../constants';

interface PublicDashboardProps {
    onJoin?: () => void;
}

export default function PublicDashboard({ onJoin }: PublicDashboardProps) {
    const [campaign, setCampaign] = useState<PrayerCampaign | null>(null);
    const [signups, setSignups] = useState<PrayerSignup[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');

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

        // Lógica de Vagas Dinâmicas: Começa em 5, aumenta +3 para TODOS somente quando TODOS os horários estiverem cheios
        const baseCapacity = 5;
        let globalCapacity = baseCapacity;

        // Calculamos os inscritos brutos por slot primeiro
        const rawCounts = slots.map(s => signups.filter(su => su.slotNumber === s).length);

        // Aumentamos a capacidade global enquanto TODOS os slots estiverem preenchidos até o limite atual
        while (rawCounts.every(count => count >= globalCapacity)) {
            globalCapacity += 3;
        }

        const slotCounts = slots.map((s, i) => {
            return {
                index: s,
                count: rawCounts[i],
                capacity: globalCapacity,
                isFull: false
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
            preStartCount,
            searchResult: searchQuery.length >= 3 ? signups.find(s => {
                const q = searchQuery.toLowerCase();
                const qDigits = q.replace(/\D/g, '');

                const nameMatch = s.member?.name?.toLowerCase().includes(q);
                // Só valida busca por telefone se o usuário digitar algum número
                const phoneMatch = qDigits !== '' && s.member?.phone?.replace(/\D/g, '').includes(qDigits);

                return nameMatch || phoneMatch;
            }) : null
        };
    }, [campaign, signups, currentTime, searchQuery]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900 p-4 font-sans">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4 shadow-xl"></div>
                <p className="text-indigo-600/60 font-black uppercase tracking-[0.2em] text-xs">Sincronizando Relógio...</p>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900 p-4 text-center font-sans">
                <div className="bg-white/80 backdrop-blur-3xl p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl max-w-md">
                    <Clock className="w-16 h-16 text-indigo-600 mx-auto mb-6 opacity-40 animate-pulse" />
                    <h2 className="text-3xl font-black mb-4 tracking-tighter text-slate-800">Fique Atento!</h2>
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
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-600 selection:text-white pb-32 overflow-x-hidden relative">
            {/* Soft Ambient Particles / Lighting */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-5%] right-[-5%] w-[80%] h-[80%] bg-indigo-500/10 blur-[180px] rounded-full"></div>
                <div className="absolute bottom-[-5%] left-[-5%] w-[70%] h-[70%] bg-purple-500/10 blur-[180px] rounded-full"></div>
                <div className="absolute top-[30%] left-[-20%] w-[50%] h-[50%] bg-blue-500/5 blur-[150px] rounded-full"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pt-16 relative z-10">

                {/* Header Section */}
                <div className="text-center mb-16 animate-fade-in">
                    <div className="inline-flex items-center gap-3 bg-white border border-indigo-100 px-6 py-2 rounded-full mb-8 shadow-sm">
                        <Sparkles size={14} className="text-indigo-600" />
                        <span className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em]">Painel da Intercessão</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-[0.9] text-slate-900">
                        {campaign.title}
                    </h1>

                    <div className="flex flex-wrap justify-center gap-4 mt-8">
                        <div className="flex items-center gap-3 bg-white/70 backdrop-blur-xl px-6 py-3 rounded-2xl border border-slate-200 shadow-md">
                            <Calendar size={18} className="text-indigo-600" />
                            <span className="font-black text-sm uppercase tracking-wider text-slate-700">Início: {new Date(campaign.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/70 backdrop-blur-xl px-6 py-3 rounded-2xl border border-slate-200 shadow-md">
                            <Clock size={18} className="text-indigo-600" />
                            <span className="font-black text-sm uppercase tracking-wider text-slate-700">{campaign.duration} Horas de Chamado</span>
                        </div>
                    </div>
                </div>

                {/* Search My Schedule */}
                <div className="max-w-xl mx-auto mb-16 animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <label className="block text-center text-indigo-600 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Veja seu horário</label>
                    <div className="bg-white/80 backdrop-blur-2xl p-2 rounded-[2.5rem] border border-slate-200 shadow-xl flex items-center gap-2 group focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
                        <div className="pl-6 text-slate-400">
                            <Users size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Digite seu nome ou telefone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 font-bold placeholder:text-slate-400 py-4"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="p-2 mr-2 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors"
                            >
                                <Sparkles size={16} className="rotate-45" />
                            </button>
                        )}
                    </div>

                    {/* Search Result Card */}
                    {stats.searchResult && (
                        <div className="mt-4 animate-fade-in-up">
                            <div className="bg-indigo-600 p-6 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 border border-indigo-500 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:scale-110 transition-transform">
                                    <Trophy size={80} />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="text-center md:text-left">
                                        <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Encontramos você! 🛡️</p>
                                        <h3 className="text-2xl font-black tracking-tight">{stats.searchResult.member?.name}</h3>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 text-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100 mb-1">Seu Turno é o <span className="text-amber-300">{PRAYER_SLOT_NAMES[stats.searchResult.slotNumber % 12]}</span> às</p>
                                        <p className="text-3xl font-black tabular-nums">{formatTime(stats.searchResult.slotNumber)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* No Result Warning */}
                    {searchQuery.length > 2 && !stats.searchResult && (
                        <div className="mt-4 animate-fade-in-up">
                            <div className="bg-red-500 p-6 rounded-[2.5rem] text-white shadow-2xl shadow-red-200 border border-red-400 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:scale-110 transition-transform">
                                    <AlertCircle size={80} />
                                </div>
                                <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
                                    <p className="text-red-100 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Ops! Não te achamos 🥺</p>
                                    <h3 className="text-lg md:text-xl font-bold tracking-tight">
                                        É crente, ainda não escolheu um horario de oração! Clique em <button onClick={onJoin} className="font-black underline decoration-red-300 underline-offset-4 hover:text-red-100 transition-colors">quero participar</button> e escolha um horario para orar Crente! Toma tipo!
                                    </h3>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">

                    {/* Countdown / Current Status Card */}
                    <div className="lg:col-span-8 space-y-8">
                        {stats.preStartCount ? (
                            /* PRE-START COUNTDOWN - LIGHT THEME */
                            <div className="bg-white/90 backdrop-blur-3xl p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl relative overflow-hidden group border-b-[12px] border-indigo-600/20">
                                <div className="text-center relative z-10">
                                    <h3 className="text-indigo-600 text-xs font-black uppercase tracking-[0.4em] mb-12">O Clamor Começa Em</h3>

                                    <div className="flex justify-center gap-4 md:gap-8">
                                        {[
                                            { label: 'DIAS', val: stats.preStartCount.d },
                                            { label: 'HORAS', val: stats.preStartCount.h },
                                            { label: 'MIN', val: stats.preStartCount.m },
                                            { label: 'SEG', val: stats.preStartCount.s }
                                        ].map((unit, i) => (
                                            <div key={i} className="flex flex-col items-center gap-4">
                                                <div className="w-20 h-20 md:w-28 md:h-28 bg-slate-50 flex items-center justify-center rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm group-hover:border-indigo-400 transition-all duration-500">
                                                    <span className="text-4xl md:text-5xl font-black text-slate-900 tabular-nums">
                                                        {unit.val.toString().padStart(2, '0')}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 tracking-[0.2em]">{unit.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* LIVE STATUS - DURING CAMPAIGN (LIGHT THEME) */
                            <div className="bg-white/90 backdrop-blur-3xl p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl relative overflow-hidden group border-b-[12px] border-indigo-600/20">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-all duration-1000">
                                    <Activity size={180} className="text-indigo-600" />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-10">
                                        <div className="flex h-3 w-3 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                        </div>
                                        <h3 className="text-slate-500 text-xs font-black uppercase tracking-[0.3em]">Intercessão em Tempo Real</h3>
                                    </div>

                                    <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-8 mb-12">
                                        <span className="text-9xl md:text-[12rem] font-black text-slate-900 tracking-tighter leading-[0.85]">
                                            {stats.currentSlotCount}
                                        </span>
                                        <div className="mb-6">
                                            <h4 className="text-3xl font-black text-slate-800 tracking-tight">Vozes Unidas</h4>
                                            <p className="text-xl font-bold text-indigo-600/60 tracking-tight">nesta hora de clamor</p>
                                        </div>
                                    </div>

                                    {/* TURN COUNTDOWN - LIGHT THEME */}
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-[2.5rem] p-8 flex items-center justify-between group-hover:bg-indigo-100/50 transition-all duration-500">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-indigo-200 shadow-sm">
                                                <Clock size={32} className="text-indigo-600 animate-pulse" />
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Próxima Troca de Turno</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-mono font-black text-slate-900 tabular-nums tracking-wider">{stats.timeLeft.h}:{stats.timeLeft.m}:{stats.timeLeft.s}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="hidden sm:block">
                                            <div className="px-4 py-2 bg-white rounded-full border border-slate-200 text-[10px] font-black text-indigo-600/50 uppercase tracking-widest">Sincronizado</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Progress Bar - Improved for Light Mode */}
                        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] border border-slate-200 shadow-xl">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <Trophy size={20} className="text-indigo-600" />
                                    <h5 className="font-black text-sm uppercase tracking-widest text-slate-600">Nível de Mobilização</h5>
                                </div>
                                <span className="text-2xl font-black text-indigo-600 tabular-nums">{stats.progress}%</span>
                            </div>
                            <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1 border border-slate-200 inset-shadow-sm">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full transition-all duration-1000 relative"
                                    style={{ width: `${stats.progress}%` }}
                                >
                                    <div className="absolute top-0 bottom-0 right-0 w-8 bg-white/20 blur-md"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary & Action Cards */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-12 rounded-[3.5rem] shadow-2xl shadow-indigo-200 relative overflow-hidden group flex-1 flex flex-col justify-between">
                            <div className="absolute top-[-5%] right-[-5%] opacity-20 transform -rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                                <Sparkles size={240} className="text-white" />
                            </div>

                            <div>
                                <h3 className="text-indigo-100/60 text-xs font-black uppercase tracking-[0.3em] mb-12">Total de Intercessores</h3>
                                <div className="text-9xl font-black text-white tracking-tighter mb-4">
                                    {stats.total}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <p className="text-lg font-bold text-white leading-tight">Uma igreja que ora é uma igreja vitoriosa.</p>
                                <div className="bg-white/20 backdrop-blur-xl p-6 rounded-3xl border border-white/20">
                                    <div className="flex items-center gap-4">
                                        <Users className="text-white" size={24} />
                                        <span className="text-xs font-black uppercase tracking-widest text-white">Mobilização Geral</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* JOIN CTA - VIBRANT THEME */}
                        <button
                            onClick={onJoin}
                            className="bg-slate-900 hover:bg-black text-white p-10 rounded-[3rem] shadow-2xl flex items-center justify-between group transition-all duration-500 transform hover:scale-[1.02] active:scale-95 border-b-[12px] border-slate-700"
                        >
                            <div className="text-left">
                                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">Engaje-se Agora</span>
                                <h4 className="text-4xl font-black tracking-tighter">Quero Participar</h4>
                            </div>
                            <div className="w-20 h-20 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl group-hover:bg-indigo-500 transition-colors group-hover:rotate-12 transform">
                                <MousePointer2 size={32} />
                            </div>
                        </button>
                    </div>
                </div>

                {/* DENSITY GRID - LIGHT PREMIUM REWORK */}
                <div className="bg-white/90 backdrop-blur-3xl p-12 rounded-[4rem] border border-slate-200 shadow-2xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 text-indigo-600 shadow-sm">
                                <Activity size={32} />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black tracking-tighter text-slate-900">Distribuição de Escala</h3>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Monitoramento Detalhado de Ocupação</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-8 bg-slate-100/80 p-5 px-10 rounded-full border border-slate-200 backdrop-blur-3xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-[#f0fdf4] border border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Livre</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)] animate-pulse"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Alerta</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.4)]"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Em Foco</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-4">
                        {stats.slotCounts.map((slot, i) => {
                            const isCurrent = stats.currentSlotIndex === i;
                            const isFull = slot.count >= slot.capacity;
                            const isAlmostFull = slot.count === slot.capacity - 1;
                            const isEmpty = slot.count === 0;
                            const isFilling = !isFull && !isAlmostFull && !isEmpty;

                            let cardClass = "bg-white border-slate-200 shadow-sm";
                            let iconColor = "text-slate-400";
                            let countColor = "text-slate-700";
                            let statusText = "0 Vagas";
                            let cursorClass = "cursor-default";
                            let onClickHandler = undefined;

                            if (isCurrent) {
                                cardClass = "bg-indigo-600 border-indigo-400 shadow-[0_20px_40px_rgba(79,70,229,0.2)] ring-4 ring-indigo-100 z-10 scale-110";
                                iconColor = "text-indigo-100";
                                countColor = "text-white";
                                statusText = "AGORA";
                            } else if (isFull) {
                                cardClass = "bg-slate-50 border-slate-200 opacity-60";
                                iconColor = "text-slate-400";
                                countColor = "text-slate-500";
                                statusText = "Completo";
                            } else if (isAlmostFull) {
                                cardClass = "bg-amber-50 border-amber-400 hover:border-amber-500 shadow-[0_4px_15px_rgba(245,158,11,0.2)] hover:scale-105 transition-all z-10";
                                iconColor = "text-amber-600";
                                countColor = "text-amber-800";
                                statusText = "1 Vaga";
                                cursorClass = "cursor-pointer";
                                onClickHandler = onJoin;
                            } else if (isEmpty) {
                                cardClass = "bg-[#f0fdf4] border-emerald-400 hover:border-emerald-500 hover:bg-emerald-50 shadow-[0_4px_15px_rgba(52,211,153,0.3)] ring-2 ring-emerald-100 hover:scale-105 transition-all z-10";
                                iconColor = "text-emerald-600";
                                countColor = "text-emerald-800";
                                statusText = `${slot.capacity} Vagas`;
                                cursorClass = "cursor-pointer";
                                onClickHandler = onJoin;
                            } else if (isFilling) {
                                cardClass = "bg-[#f0fdf4] border-emerald-400 hover:border-emerald-500 hover:bg-emerald-50 shadow-[0_4px_15px_rgba(52,211,153,0.3)] ring-2 ring-emerald-100 hover:scale-105 transition-all z-10";
                                iconColor = "text-emerald-600";
                                countColor = "text-emerald-800";
                                statusText = `${slot.capacity - slot.count} Vagas`;
                                cursorClass = "cursor-pointer";
                                onClickHandler = onJoin;
                            }

                            return (
                                <div
                                    key={i}
                                    onClick={onClickHandler}
                                    style={{ animationDelay: `${i * 30}ms` }}
                                    className={`relative p-6 rounded-[2.5rem] border flex flex-col items-center justify-center gap-3 group overflow-hidden animate-fade-in-up transition-all duration-300 ${cursorClass} ${cardClass}`}
                                >
                                    {/* Abstract background pattern for premium feel */}
                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] group-hover:opacity-[0.05] transition-opacity"></div>

                                    {/* Glass reflection */}
                                    <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/10 to-transparent skew-y-[-10deg] transform -translate-y-10 group-hover:translate-y-[-20%] transition-transform duration-1000"></div>

                                    <div className="flex flex-col items-center">
                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${iconColor}`}>
                                            {PRAYER_SLOT_NAMES[slot.index % 12]}
                                        </span>
                                        <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${iconColor}`}>
                                            {formatTime(slot.index)}
                                        </span>
                                    </div>

                                    <div className="relative">
                                        <span className={`text-4xl font-black transition-colors tabular-nums tracking-tighter ${countColor}`}>
                                            {slot.count}
                                        </span>
                                        <span className={`text-[10px] font-bold absolute -right-5 top-0 opacity-40 ${countColor}`}>/ {slot.capacity}</span>
                                    </div>

                                    <span className={`text-[8px] font-black uppercase whitespace-nowrap tracking-[0.2em] px-3 py-1.5 rounded-full border border-current opacity-90 shadow-sm transition-all group-hover:scale-105 group-hover:bg-white/50 ${iconColor}`}>
                                        <span className="group-hover:hidden">{statusText}</span>
                                        <span className="hidden group-hover:inline">{onClickHandler ? 'Clique' : statusText}</span>
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
                                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.05] transition-colors duration-500"></div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-12 flex items-center justify-center gap-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
                        <Sparkles size={20} className="text-amber-500" />
                        <p className="text-slate-500 text-sm font-bold">
                            Lógica de Vagas Dinâmicas ativa: O sistema abre <span className="text-indigo-600">+3 vagas</span> automaticamente sob demanda.
                        </p>
                    </div>
                </div>

                {/* Footer Quote */}
                <div className="mt-20 text-center animate-fade-in pb-10">
                    <p className="text-slate-400 font-bold italic text-base tracking-tight max-w-2xl mx-auto leading-relaxed">
                        "Se o meu povo, que se chama pelo meu nome, se humilhar e orar, buscar a minha face e se afastar dos seus maus caminhos, dos céus o ouvirei, perdoarei o seu pecado e curarei a sua terra."
                        <span className="block mt-4 text-[10px] font-black not-italic tracking-[0.3em] uppercase opacity-60">2 Crônicas 7:14</span>
                    </p>
                </div>

            </div>
        </div>
    );
}
