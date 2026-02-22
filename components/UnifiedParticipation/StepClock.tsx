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
    const [mode, setMode] = useState<'intro' | 'selection'>(initialSlots.length > 0 ? 'selection' : 'intro');

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
        setStep(3);
    };

    const handleSkip = () => {
        setClockData(null);
        setStep(3);
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

    if (mode === 'intro') {
        return (
            <div className="animate-fade-in-up space-y-8 py-10 text-center">
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-30 animate-pulse"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full flex items-center justify-center mx-auto shadow-2xl border-4 border-white/10">
                        <Flame size={48} className="text-white animate-bounce" />
                    </div>
                </div>
                <div className="space-y-4 max-w-sm mx-auto">
                    <h2 className="text-3xl font-bold text-white leading-tight">Você pode assumir um turno de oração?</h2>
                    <p className="text-slate-300 text-lg leading-relaxed">
                        Serão <strong className="text-indigo-400">{activeCampaign.duration} horas</strong> de intercessão. Escolha turnos para clamar e fortalecer a igreja em oração.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-4 max-w-xs mx-auto pt-4">
                    <button onClick={() => setMode('selection')} className="w-full py-4 px-6 bg-white text-indigo-900 font-extrabold rounded-2xl shadow-xl hover:bg-indigo-50 transition-all text-lg flex items-center justify-center gap-2">🙌 Quero meu turno</button>
                    <button onClick={handleSkip} className="w-full py-3 px-6 text-slate-400 font-medium hover:text-white transition-colors">Ficarei somente no jejum</button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up space-y-6 pb-24">
            <div className="text-center">
                <div className="inline-block p-3 bg-indigo-500/20 rounded-full mb-2">
                    <Clock className="text-indigo-400" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white">{appSettings?.prayerClockTitle || 'Relógio de Oração'}</h2>
                <p className="text-slate-300">Escolha seus horários de intercessão.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                {slots.map(slot => {
                    const isSelected = selectedSlots.includes(slot);
                    const count = getSlotCount(slot);
                    const isFull = count >= 10;
                    return (
                        <button
                            key={slot}
                            disabled={isFull}
                            onClick={() => handleSlotClick(slot)}
                            className={`relative p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-300'} ${isFull ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span className="text-lg font-bold">{getSlotTime(slot)}</span>
                            <div className="flex items-center gap-1 text-xs opacity-70"><Users size={10} /> {count}</div>
                        </button>
                    );
                })}
            </div>
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/90 backdrop-blur-sm z-50">
                <div className="max-w-lg mx-auto flex gap-3">
                    <button onClick={() => setMode('intro')} className="px-4 py-4 bg-slate-800 text-slate-300 rounded-xl"><ArrowLeft size={20} /></button>
                    <button onClick={handleSkip} className="px-4 py-4 text-slate-400">Pular</button>
                    <button onClick={handleNext} disabled={selectedSlots.length === 0} className="flex-1 bg-white text-indigo-900 font-bold py-4 rounded-xl disabled:opacity-50">Confirmar <ArrowRight size={20} /></button>
                </div>
            </div>
        </div>
    );
}
