import React, { useState, useEffect } from 'react';
import { useParticipation } from '../../contexts/ParticipationContext';
import { getPrayerCampaigns, getPrayerSignups } from '../../services/db';
import { ArrowLeft, ArrowRight, Clock, Users, Flame, Heart } from 'lucide-react';

export function StepClock() {
    const { setStep, setClockData, user, config } = useParticipation() as any;
    const [activeCampaign, setActiveCampaign] = useState<any>(null);
    const [signups, setSignups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
    const [mode, setMode] = useState<'intro' | 'selection'>('intro');

    useEffect(() => {
        loadCampaign();
    }, []);

    const loadCampaign = async () => {
        setLoading(true);
        const campaigns = await getPrayerCampaigns();
        // Filter for active campaign. If config.activeCampaignId is set, use that, else use first active.
        const active = campaigns.find((c: any) => c.isActive); // Simplification

        if (active) {
            setActiveCampaign(active);
            const s = await getPrayerSignups(active.id);
            setSignups(s);
        }
        setLoading(false);
    };

    const handleSlotClick = (slot: number) => {
        setSelectedSlots(prev => {
            if (prev.includes(slot)) {
                return prev.filter(s => s !== slot);
            } else {
                return [...prev, slot];
            }
        });
    };

    const handleNext = () => {
        if (selectedSlots.length === 0) return;
        setClockData({
            campaignId: activeCampaign.id,
            slotNumbers: selectedSlots // Now sending array
        });
        setStep(3); // Success
    };

    const handleSkip = () => {
        setClockData(null); // Explicitly skipped
        setStep(3); // Success
    };

    const handleIntroAccept = () => {
        setMode('selection');
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

    // Helper to calculate time for slot
    const getSlotTime = (slot: number) => {
        const date = new Date(activeCampaign.startDate);
        date.setHours(date.getHours() + slot);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Helper to get count for slot
    const getSlotCount = (slot: number) => {
        return signups.filter(s => s.slotNumber === slot).length;
    };

    // Assuming 24h or duration from campaign
    const slots = Array.from({ length: activeCampaign.duration }, (_, i) => i);

    // --- MODE: INTRO (Upsell) ---
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
                    <h2 className="text-3xl font-bold text-white leading-tight">
                        Vamos potencializar com oração?
                    </h2>
                    <p className="text-slate-300 text-lg leading-relaxed">
                        Que tal separar <strong className="text-indigo-400">1 hora</strong> para interceder junto com a igreja?
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 max-w-xs mx-auto pt-4">
                    <button
                        onClick={handleIntroAccept}
                        className="w-full py-4 px-6 bg-white text-indigo-900 font-extrabold rounded-2xl shadow-xl shadow-indigo-900/50 hover:bg-indigo-50 hover:scale-105 transition-all text-lg flex items-center justify-center gap-2 group"
                    >
                        <Heart className="group-hover:text-red-500 transition-colors" fill="currentColor" size={20} />
                        Sim, eu quero!
                    </button>

                    <button
                        onClick={handleSkip}
                        className="w-full py-3 px-6 text-slate-400 font-medium hover:text-white transition-colors"
                    >
                        Agora não, apenas o jejum
                    </button>
                </div>
            </div>
        );
    }

    // --- MODE: SELECTION ---
    return (
        <div className="animate-fade-in-up space-y-6 pb-24">
            <div className="text-center">
                <div className="inline-block p-3 bg-indigo-500/20 rounded-full mb-2">
                    <Clock className="text-indigo-400" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white">Relógio de Oração</h2>
                <p className="text-slate-300">Escolha seus horários de intercessão.</p>
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                {slots.map(slot => {
                    const time = getSlotTime(slot);
                    const count = getSlotCount(slot);
                    const isSelected = selectedSlots.includes(slot);
                    const isFull = count >= 10; // Hard limit for demo

                    return (
                        <button
                            key={slot}
                            disabled={isFull}
                            onClick={() => handleSlotClick(slot)}
                            className={`
                                relative p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all
                                ${isSelected
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/50 scale-105 z-10'
                                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700'}
                                ${isFull ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                            `}
                        >
                            <span className="text-lg font-bold">{time}</span>
                            <div className="flex items-center gap-1 text-xs opacity-70">
                                <Users size={10} /> {count}
                            </div>
                            {isSelected && (
                                <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full"></div>
                            )}
                        </button>
                    );
                })}
            </div>

            <p className="text-center text-xs text-slate-500">
                {selectedSlots.length > 0 ? `${selectedSlots.length} horário(s) selecionado(s)` : 'Selecione pelo menos um horário'}
            </p>

            {/* Footer Action */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900 via-gray-900/90 to-transparent z-50 backdrop-blur-sm">
                <div className="max-w-lg mx-auto flex gap-3">
                    <button
                        onClick={() => setMode('intro')}
                        className="px-4 py-4 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <button
                        onClick={handleSkip}
                        className="px-4 py-4 text-slate-400 hover:text-white font-medium transition-colors"
                    >
                        Pular
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={selectedSlots.length === 0}
                        className="flex-1 bg-white text-indigo-900 font-bold py-4 rounded-xl shadow-lg hover:bg-slate-100 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirmar <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
