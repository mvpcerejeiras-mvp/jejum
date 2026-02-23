import React, { useState, useEffect } from 'react';
import { useParticipation } from '../../contexts/ParticipationContext';
import { getPrayerCampaigns, getPrayerSignups } from '../../services/db';
import { ArrowLeft, ArrowRight, Users, Flame } from 'lucide-react';

export function StepClock() {
    const { setStep, setClockData, participationData, appSettings, isAdmin } = useParticipation() as any;
    const [activeCampaign, setActiveCampaign] = useState<any>(null);
    const [signups, setSignups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

    useEffect(() => {
        if (!activeCampaign?.startDate) return;

        const timer = setInterval(() => {
            const start = new Date(activeCampaign.startDate).getTime();
            const now = new Date().getTime();
            const diff = start - now;

            if (diff <= 0) {
                setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
                clearInterval(timer);
                return;
            }

            setTimeLeft({
                d: Math.floor(diff / (1000 * 60 * 60 * 24)),
                h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                s: Math.floor((diff % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [activeCampaign?.startDate]);

    const initialSlots = participationData?.prayer?.map((s: any) => s.slot_number) || [];
    const [selectedSlots, setSelectedSlots] = useState<number[]>(initialSlots);

    useEffect(() => {
        loadCampaign();
    }, []);

    const loadCampaign = async () => {
        setLoading(true);
        try {
            const campaigns = await getPrayerCampaigns();
            const active = campaigns.find((c: any) => c.isActive);
            if (active) {
                setActiveCampaign(active);
                const s = await getPrayerSignups(active.id);
                setSignups(s);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSlotClick = (slot: number) => {
        const count = getSlotCount(slot);
        const isFull = count >= currentLimit;

        if (isFull && !isAdmin && !selectedSlots.includes(slot)) {
            alert("Este horário já atingiu o limite de vagas. Por favor, escolha outro horário disponível!");
            return;
        }

        setSelectedSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]);
    };

    const handleNext = () => {
        if (selectedSlots.length === 0) return;
        setClockData({
            campaignId: activeCampaign.id,
            slotNumbers: selectedSlots
        });
        setStep(4);
    };

    const handleSkip = () => {
        setClockData(null);
        setStep(4);
    };

    if (loading) return <div className="text-white text-center py-10">Carregando horários...</div>;

    if (!activeCampaign) {
        return (
            <div className="text-white text-center py-10 space-y-4">
                <p>Nenhum relógio de oração ativo no momento.</p>
                <button onClick={handleSkip} className="text-indigo-400 font-bold">Pular esta etapa</button>
            </div>
        );
    }

    const getSlotTime = (slot: number) => {
        const date = new Date(activeCampaign.startDate);
        date.setHours(date.getHours() + slot);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getSlotCount = (slot: number) => signups.filter(s => s.slotNumber === slot).length;
    const slots = Array.from({ length: activeCampaign.duration }, (_, i) => i);

    const countsBySlot = slots.map(slot => getSlotCount(slot));
    const minCount = countsBySlot.length > 0 ? Math.min(...countsBySlot) : 0;

    let currentLimit = 5;
    if (minCount >= 5) {
        currentLimit = 5 + 3 * (Math.floor((minCount - 5) / 3) + 1);
    }

    return (
        <div className="animate-fade-in-up space-y-8 pb-24">
            <div className="text-center space-y-4">
                {/* Countdown Display */}
                <div className="flex justify-center gap-2 md:gap-3 mb-4">
                    {[
                        { label: 'dias', value: timeLeft.d },
                        { label: 'horas', value: timeLeft.h },
                        { label: 'min', value: timeLeft.m },
                        { label: 'seg', value: timeLeft.s }
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <div className="w-12 h-14 md:w-16 md:h-16 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center shadow-xl group hover:border-indigo-500/50 transition-colors">
                                <span className={`text-xl md:text-2xl font-black ${item.value > 0 || i === 3 ? 'text-white' : 'text-slate-600'}`}>
                                    {String(item.value).padStart(2, '0')}
                                </span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500 mt-2">{item.label}</span>
                        </div>
                    ))}
                </div>

                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
                        {appSettings?.prayerClockTitle?.includes('(')
                            ? appSettings.prayerClockTitle
                            : `${appSettings?.prayerClockTitle || 'Relógio de Oração'}`}
                    </h2>
                    <p className="text-indigo-300/80 text-sm font-bold mt-1">
                        {new Date(activeCampaign?.startDate).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2 shadow-lg backdrop-blur-sm">
                            <Users size={12} className="text-indigo-500" />
                            Meta: {currentLimit} pessoas / hora
                        </span>
                    </div>
                </div>
                <p className="text-slate-400 text-xs font-medium px-8 leading-relaxed max-w-sm mx-auto">
                    {minCount < currentLimit - 3
                        ? "Preencha todos os horários para liberarmos novas vagas!"
                        : "Estamos quase lá! Vamos fechar todos os horários."}
                </p>
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-[45vh] overflow-y-auto pr-1">
                {slots.map(slot => {
                    const isSelected = selectedSlots.includes(slot);
                    const count = getSlotCount(slot);
                    const isFull = count >= currentLimit;
                    const isNearFull = count >= currentLimit - 2 && !isFull;

                    let statusLabel = "LIVRE";
                    let statusColor = "text-emerald-400";
                    if (isFull) {
                        statusLabel = "LOTADO";
                        statusColor = "text-red-500";
                    } else if (isNearFull) {
                        statusLabel = "QUASE CHEIO";
                        statusColor = "text-amber-400";
                    }

                    return (
                        <button
                            key={slot}
                            onClick={() => handleSlotClick(slot)}
                            className={`relative p-3 pt-4 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all 
                                ${isFull
                                    ? (isSelected
                                        ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/40 scale-[1.02] z-10 ring-2 ring-red-500/50'
                                        : 'bg-red-500/10 border-red-500/40 text-red-200')
                                    : isSelected
                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg scale-[1.02] z-10'
                                        : isNearFull
                                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                                            : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-500'
                                }`}
                        >
                            <span className={`absolute top-1.5 text-[9px] font-black uppercase tracking-wider ${isSelected ? (isFull ? 'text-red-100' : 'text-indigo-100') : statusColor}`}>
                                {statusLabel}
                            </span>
                            <span className="text-lg font-bold">{getSlotTime(slot)}</span>
                            <div className="flex items-center gap-1 text-xs opacity-70">
                                <Users size={10} />
                                <span className={isSelected ? 'text-white' : isFull ? 'text-red-500 font-bold' : isNearFull ? 'text-amber-400' : ''}>{count}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/90 backdrop-blur-sm z-50">
                <div className="max-w-lg mx-auto flex gap-3">
                    <button onClick={() => setStep(2)} className="px-4 py-4 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"><ArrowLeft size={20} /></button>
                    <button onClick={handleNext} disabled={selectedSlots.length === 0} className="flex-1 bg-white text-indigo-900 font-bold py-4 rounded-xl shadow-lg hover:bg-slate-100 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">Confirmar <ArrowRight size={20} /></button>
                </div>
            </div>
        </div>
    );
}
