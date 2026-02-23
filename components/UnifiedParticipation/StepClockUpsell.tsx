import React, { useState, useEffect } from 'react';
import { useParticipation } from '../../contexts/ParticipationContext';
import { getPrayerCampaigns } from '../../services/db';
import { ArrowRight, Flame, Clock, Heart } from 'lucide-react';

export function StepClockUpsell() {
    const { setStep, user, setClockData } = useParticipation() as any;
    const [campaign, setCampaign] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const campaigns = await getPrayerCampaigns();
            const active = campaigns.find((c: any) => c.isActive);
            setCampaign(active);
            setLoading(false);
        };
        load();
    }, []);

    const handleYes = () => {
        setStep(3); // Go to Clock Selection
    };

    const handleNo = () => {
        setClockData(null);
        setStep(4); // Skip to Success
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400">Preparando convite...</p>
        </div>
    );

    if (!campaign) {
        // Fallback if no campaign is active, just skip
        handleNo();
        return null;
    }

    const firstName = user?.name ? user.name.split(' ')[0] : 'Irmão(ã)';
    const startDate = new Date(campaign.startDate);
    const dayName = startDate.toLocaleDateString('pt-BR', { weekday: 'long' });
    const formattedDate = startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    return (
        <div className="animate-fade-in-up space-y-8 py-6 text-center">
            <div className="relative inline-block">
                <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative w-28 h-28 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl border-4 border-white/20">
                    <Flame size={56} className="text-white animate-bounce" />
                </div>
            </div>

            <div className="space-y-4 max-w-sm mx-auto">
                <h2 className="text-3xl font-bold text-white leading-tight">
                    {firstName}, você gostaria de participar do relógio de oração no {dayName}, dia {formattedDate}?
                </h2>
                <p className="text-slate-300 text-lg leading-relaxed">
                    Sua intercessão faz toda a diferença para o fortalecimento da nossa igreja. 🙌
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 max-w-xs mx-auto pt-4 pb-12">
                <button
                    onClick={handleYes}
                    className="w-full py-4 px-6 bg-white text-indigo-900 font-extrabold rounded-2xl shadow-xl hover:bg-indigo-50 transition-all text-lg flex items-center justify-center gap-2 transform active:scale-95 group"
                >
                    <span>Sim, eu quero!</span>
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                    onClick={handleNo}
                    className="w-full py-3 px-6 text-slate-400 font-medium hover:text-white transition-colors"
                >
                    Agora não, ficarei só no jejum
                </button>
            </div>

            {/* Micro-incentive */}
            <div className="flex items-center justify-center gap-2 text-indigo-300/60 text-xs font-medium">
                <Heart size={12} />
                <span>"A oração do justo é poderosa e eficaz."</span>
            </div>
        </div>
    );
}
