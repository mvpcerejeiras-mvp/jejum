import React, { useState, useEffect } from 'react';
import { useParticipation } from '../../contexts/ParticipationContext';
import { getPrayerCampaigns, getPrayerSignups } from '../../services/db';
import { ArrowLeft, ArrowRight, Clock, Users } from 'lucide-react';

export function StepClock() {
    const { setStep, setClockData, user, config } = useParticipation() as any;
    const [activeCampaign, setActiveCampaign] = useState<any>(null);
    const [signups, setSignups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

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
        if (selectedSlot === slot) {
            setSelectedSlot(null);
        } else {
            setSelectedSlot(slot);
        }
    };

    const handleNext = () => {
        if (selectedSlot === null) return;
        setClockData({
            campaignId: activeCampaign.id,
            slotNumber: selectedSlot
        });
        setStep(3); // Success
    };

    const handleSkip = () => {
        setClockData(null); // Explicitly skipped
        setStep(3); // Success
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

    return (
        <div className="animate-fade-in-up space-y-6 pb-24">
            <div className="text-center">
                <div className="inline-block p-3 bg-indigo-500/20 rounded-full mb-2">
                    <Clock className="text-indigo-400" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white">Relógio de Oração</h2>
                <p className="text-slate-300">Escolha um horário para interceder.</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {slots.map(slot => {
                    const time = getSlotTime(slot);
                    const count = getSlotCount(slot);
                    const isSelected = selectedSlot === slot;
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
                        </button>
                    );
                })}
            </div>

            {/* Footer Action */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900 via-gray-900/90 to-transparent z-50 backdrop-blur-sm">
                <div className="max-w-lg mx-auto flex gap-3">
                    <button
                        onClick={() => {
                            const config = (useParticipation() as any).config;
                            setStep(config?.eventMode === 'prayer_clock' ? 0 : 1);
                        }}
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
                        disabled={selectedSlot === null}
                        className="flex-1 bg-white text-indigo-900 font-bold py-4 rounded-xl shadow-lg hover:bg-slate-100 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirmar <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
