import React, { useState, useEffect } from 'react';
import { useParticipation } from '../../contexts/ParticipationContext';
import { getPrayerCampaigns, getPrayerSignups } from '../../services/db';
import { ArrowLeft, ArrowRight, Clock, Users, Flame } from 'lucide-react';

export function StepClock() {
    const { setStep, setClockData, participationData, appSettings } = useParticipation() as any;
    const [activeCampaign, setActiveCampaign] = useState<any>(null);
    const [signups, setSignups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
        <div className="animate-fade-in-up space-y-6 pb-24">
            <div className="text-center space-y-2">
                <div className="inline-block p-3 bg-indigo-500/20 rounded-full mb-1">
                    <Clock className="text-indigo-400" size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">{appSettings?.prayerClockTitle || 'Relógio de Oração'} ({new Date(activeCampaign?.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})</h2>
                    <div className="flex items-center justify-center gap-2 mt-1">
                        <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-xs font-bold text-indigo-300 flex items-center gap-1.5 transition-all">
                            <Users size={12} />
                            Meta Atual: {currentLimit} pessoas por hora
                        </span>
                    </div>
                </div>
                <p className="text-slate-400 text-sm px-4">
                    {minCount < currentLimit - 3
                        ? "Preencha todos os horários para liberar mais vagas!"
                        : "Meta próxima! Vamos fechar todos os horários."}
                </p>
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-[45vh] overflow-y-auto pr-1">
                {slots.map(slot => {
                    const isSelected = selectedSlots.includes(slot);
                    const count = getSlotCount(slot);
                    const isFull = count >= currentLimit;
                    return (
                        <button
                            key={slot}
                            disabled={isSelected ? false : isFull}
                            onClick={() => handleSlotClick(slot)}
                            className={`relative p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-300'} ${isFull && !isSelected ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
                        >
                            <span className="text-lg font-bold">{getSlotTime(slot)}</span>
                            <div className="flex items-center gap-1 text-xs opacity-70">
                                <Users size={10} />
                                <span className={count >= currentLimit ? 'text-indigo-300 font-bold' : ''}>{count}</span>
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
