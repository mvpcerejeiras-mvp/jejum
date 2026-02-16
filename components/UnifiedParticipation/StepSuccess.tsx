import React, { useEffect, useState } from 'react';
import { useParticipation } from '../../contexts/ParticipationContext';
import { addPrayerSignup, saveParticipant, getPrayerCampaigns } from '../../services/db';
import { CheckCircle, Share2, Calendar, Clock, ArrowRight } from 'lucide-react';
import { FastDay, FastType, FastTime } from '../../types';

export function StepSuccess() {
    const { user, fastingData, clockData, appSettings } = useParticipation() as any;
    const [saving, setSaving] = useState(true);
    const [error, setError] = useState('');
    const [savedSlots, setSavedSlots] = useState<string[]>([]);

    useEffect(() => {
        const saveData = async () => {
            if (!fastingData) return; // Should not happen in normal flow

            // 1. Save Fasting Data
            const fastRes = await saveParticipant({
                name: user.name,
                phone: user.phone,
                days: fastingData.days,
                type: fastingData.type,
                time: fastingData.time
            });

            if (!fastRes.success) {
                setError(fastRes.message || 'Erro ao salvar jejum.');
                setSaving(false);
                return;
            }

            // 2. Save Clock Data (if selected)
            if (clockData && clockData.slotNumbers && clockData.slotNumbers.length > 0) {
                const slots = clockData.slotNumbers as number[];
                const slotTimeStrings: string[] = [];

                // We need campaign info to calculate times for display
                // (Optimally this would be passed or we fetch it briefly)
                const campaigns = await getPrayerCampaigns();
                const campaign = campaigns.find((c: any) => c.id === clockData.campaignId);

                if (campaign) {
                    slots.sort((a, b) => a - b).forEach(slot => {
                        const date = new Date(campaign.startDate);
                        date.setHours(date.getHours() + slot);
                        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        slotTimeStrings.push(timeStr);
                    });
                    setSavedSlots(slotTimeStrings);
                }

                // Process all slots in parallel
                const promises = slots.map(slot =>
                    addPrayerSignup(clockData.campaignId, user.id, slot)
                );

                const results = await Promise.all(promises);
                const failures = results.filter(r => !r.success);

                if (failures.length > 0) {
                    console.error('Errors saving some slots:', failures);
                }
            }

            setSaving(false);
        };

        saveData();
    }, []);

    const getWhatsAppMessage = () => {
        let text = `*Compromisso de Jejum & Oração* 🙏\n\n`;
        text += `Eu, *${user?.name}*, assumo meu compromisso:\n\n`;

        if (fastingData?.days) {
            text += `🗓 *Jejum:*\n`;
            fastingData.days.forEach((d: string) => text += `• ${d}\n`);
            text += `Tipo: ${fastingData.type}\n`;
            text += `Horário: ${fastingData.time}\n\n`;
        }

        if (savedSlots.length > 0) {
            text += `⏰ *Relógio de Oração:*\n`;
            savedSlots.forEach(t => text += `• ${t}\n`);
            text += `\n`;
        }

        text += `_"Por isso jejuamos e suplicamos essa bênção ao nosso Deus, e ele nos atendeu." (Esdras 8:23)_`;
        return encodeURIComponent(text);
    };

    if (saving) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-white">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-bold">Salvando seu compromisso...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-white text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 text-red-400">
                    X
                </div>
                <h2 className="text-xl font-bold mb-2">Ops! Algo deu errado.</h2>
                <p className="text-slate-300 mb-6">{error}</p>
                <button onClick={() => window.location.reload()} className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold">
                    Tentar Novamente
                </button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up space-y-8 pb-24 text-center">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto ring-4 ring-green-500/30">
                <CheckCircle size={48} className="text-green-400" />
            </div>

            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white">Compromisso Confirmado!</h2>
                <p className="text-slate-300">Que Deus abençoe sua consagração.</p>
            </div>

            {/* Summary Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-left border border-white/10 shadow-xl">
                <h3 className="text-sm uppercase tracking-widest text-indigo-300 font-bold mb-4 border-b border-white/10 pb-2">Resumo</h3>

                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <Calendar className="text-indigo-400 shrink-0 mt-1" size={18} />
                        <div>
                            <div className="font-bold text-white">Jejum</div>
                            <div className="text-sm text-slate-300">
                                {fastingData?.days.map((d: string) => d.split('–')[0].trim()).join(', ')}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">{fastingData?.type} • {fastingData?.time}</div>
                        </div>
                    </div>

                    {savedSlots.length > 0 && (
                        <div className="flex items-start gap-3">
                            <Clock className="text-indigo-400 shrink-0 mt-1" size={18} />
                            <div>
                                <div className="font-bold text-white">Relógio de Oração</div>
                                <div className="text-sm text-slate-300">
                                    {savedSlots.join(', ')}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <a
                href={`https://wa.me/?text=${getWhatsAppMessage()}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-xl shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
                <Share2 size={20} /> Compartilhar no WhatsApp
            </a>

            <button
                onClick={() => window.location.reload()}
                className="w-full text-slate-500 hover:text-white py-2 text-sm transition-colors"
            >
                Voltar ao Início
            </button>
        </div>
    );
}
