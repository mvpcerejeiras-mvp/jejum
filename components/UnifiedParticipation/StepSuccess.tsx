import React, { useEffect, useState } from 'react';
import { useParticipation } from '../../contexts/ParticipationContext';
import { addPrayerSignup, saveParticipant, getPrayerCampaigns, clearPrayerSignups } from '../../services/db';
import { sendWhatsAppMessage } from '../../services/whatsapp';
import { CheckCircle, Share2, Calendar, Clock, ArrowRight } from 'lucide-react';
import { FastDay, FastType, FastTime } from '../../types';
import { TYPE_DESCRIPTIONS } from '../../constants';

export function StepSuccess({ onFinish }: { onFinish: () => void }) {
    const { user, fastingData, clockData, appSettings, justSaved, setJustSaved } = useParticipation() as any;
    const [saving, setSaving] = useState(true);
    const [error, setError] = useState('');
    const [savedSlots, setSavedSlots] = useState<string[]>([]);
    const [campaignDate, setCampaignDate] = useState<Date | null>(null);
    const hasSavedRef = React.useRef(false);

    useEffect(() => {
        const saveData = async () => {
            if (hasSavedRef.current) return;
            hasSavedRef.current = true;

            if (!fastingData) return; // Should not happen in normal flow

            // 1. Save Fasting Data
            const fastRes = await saveParticipant({
                name: user.name,
                phone: user.phone,
                member_id: user.id,
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
            let slotsSavedCount = 0;
            let currentSlotTimes: string[] = [];
            if (clockData && clockData.slotNumbers && clockData.slotNumbers.length > 0) {
                const slots = clockData.slotNumbers as number[];
                const slotTimeStrings: string[] = [];

                const campaigns = await getPrayerCampaigns();
                const campaign = campaigns.find((c: any) => c.id === clockData.campaignId);

                if (campaign) {
                    setCampaignDate(new Date(campaign.startDate));
                    slots.sort((a, b) => a - b).forEach(slot => {
                        const date = new Date(campaign.startDate);
                        date.setHours(date.getHours() + slot);
                        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        slotTimeStrings.push(timeStr);
                    });
                    setSavedSlots(slotTimeStrings);
                    currentSlotTimes = slotTimeStrings;
                    slotsSavedCount = slots.length;
                } else {
                    // Fallback to active campaign if clockData doesn't find it
                    const active = campaigns.find((c: any) => c.isActive);
                    if (active) setCampaignDate(new Date(active.startDate));
                }

                await clearPrayerSignups(clockData.campaignId, user.id);
                const promises = slots.map(slot => addPrayerSignup(clockData.campaignId, user.id, slot));
                await Promise.all(promises);
            } else {
                // No clock data, but let's try to get campaign date for fasting dates accuracy
                const campaigns = await getPrayerCampaigns();
                const active = campaigns.find((c: any) => c.isActive);
                if (active) setCampaignDate(new Date(active.startDate));
            }

            // 3. Automate WhatsApp Message (Z-API) - ONLY if it's a fresh save
            if (justSaved) {
                try {
                    // We need to wait a tiny bit for campaignDate to be available or fetch it directly here
                    const campaigns = await getPrayerCampaigns();
                    const active = campaigns.find((c: any) => c.isActive);
                    const refDate = active ? new Date(active.startDate) : null;

                    const rawMessage = decodeURIComponent(getWhatsAppMessage(slotsSavedCount > 0, currentSlotTimes, refDate));
                    await sendWhatsAppMessage(user.phone, rawMessage);
                    // Mark as processed so reload doesn't resend
                    setJustSaved(false);
                } catch (waError) {
                    console.error("Failed to send auto WhatsApp:", waError);
                }
            }

            setSaving(false);
        };

        saveData();
    }, []);

    const getWhatsAppMessage = (hasPrayer: boolean, overrideSlots?: string[], refDate?: Date | null) => {
        const firstName = user?.name ? user.name.split(' ')[0] : 'Irmão(ã)';
        const hasFasting = fastingData && fastingData.days && fastingData.days.length > 0;

        // Use provided slots or fallback to state (for manual button)
        const displaySlots = overrideSlots || savedSlots;

        let propulsion = "";
        if (hasFasting && hasPrayer) propulsion = "Jejum e Oração";
        else if (hasFasting) propulsion = "Jejum";
        else propulsion = "Oração";

        // Find fasting description details
        const typeInfo = TYPE_DESCRIPTIONS.find(t => t.id === fastingData?.type);
        let detailText = "";
        if (typeInfo && typeInfo.description) {
            detailText = typeInfo.description.map(d => `• ${d.text}: ${d.detail}`).join('\n');
        }

        const timeLabel = fastingData?.time;
        const isOption5 = fastingData?.type === FastType.DEEP_SEARCH;

        // Helper function to get date for day name
        const getDayDate = (dayFullName: string) => {
            const dayName = dayFullName.split('–')[0].trim();
            const dayMap: { [key: string]: number } = {
                'Domingo': 0, 'Segunda-feira': 1, 'Terça-feira': 2, 'Quarta-feira': 3,
                'Quinta-feira': 4, 'Sexta-feira': 5, 'Sábado': 6
            };
            const targetDay = dayMap[dayName];
            if (targetDay === undefined) return null;

            // Use the campaign date as reference. 
            // If refDate is 08/03 (Sunday), we want the dates of THAT week (Starting Mon 02/03).
            const base = refDate ? new Date(refDate) : new Date();

            // Find the Monday of the week of the base date
            const dayOfBase = base.getDay();
            const diffToMonday = (dayOfBase === 0 ? -6 : 1 - dayOfBase);
            const mondayOfWeek = new Date(base);
            mondayOfWeek.setDate(base.getDate() + diffToMonday);

            const targetDate = new Date(mondayOfWeek);
            // If it's Sunday, it's 6 days after Monday
            const offset = (targetDay === 0 ? 6 : targetDay - 1);
            targetDate.setDate(mondayOfWeek.getDate() + offset);

            return targetDate;
        };

        const formatDate = (date: Date | null) => {
            if (!date) return "";
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        };

        let text = `*Graça e paz ${firstName}!*\n\n`;
        text += `✅ Seu Propósito de ${propulsion} foi Confirmado!\n\n`;
        text += `Que Deus abençoe sua consagração 🙏🔥\n\n`;

        if (hasFasting) {
            const allDaysSelected = fastingData.days.length === appSettings.fastDays.length && appSettings.fastDays.length > 1;

            let dayStringsWithDates = "";

            if (allDaysSelected) {
                dayStringsWithDates = "Semana toda de Jejum (Segunda a Sexta)";
            } else {
                // Sort days based on their index in the week to keep it organized
                const dayOrder: { [key: string]: number } = {
                    'Segunda-feira': 1, 'Terça-feira': 2, 'Quarta-feira': 3,
                    'Quinta-feira': 4, 'Sexta-feira': 5, 'Sábado': 6, 'Domingo': 7
                };

                const sortedDays = [...fastingData.days].sort((a, b) => {
                    const nameA = a.split('–')[0].trim();
                    const nameB = b.split('–')[0].trim();
                    return (dayOrder[nameA] || 99) - (dayOrder[nameB] || 99);
                });

                dayStringsWithDates = sortedDays.map((d: string) => {
                    const date = getDayDate(d);
                    const name = d.split('–')[0].trim();
                    return date ? `${name} (${formatDate(date)})` : name;
                }).join(', ');
            }

            text += `🗓 *Jejum –* ${dayStringsWithDates}\n`;
            text += `🚀 *${typeInfo?.title || fastingData.type}*\n\n`;

            if (isOption5) {
                const firstDate = getDayDate(fastingData.days[0]);
                const deliveryDate = firstDate ? new Date(firstDate) : null;
                if (deliveryDate) deliveryDate.setDate(deliveryDate.getDate() + 1);

                text += `⏰ *Início do Jejum:* ${formatDate(firstDate)} às 18h ou 19h\n`;
                text += `🏁 *Entrega do Jejum:* ${formatDate(deliveryDate)} às 18h ou 19h (24h depois)\n\n`;
            } else {
                const firstDate = getDayDate(fastingData.days[0]);
                text += `⏰ *Início do Jejum:* ${formatDate(firstDate)} às 00h00\n`;
                text += `🏁 *Entrega do Jejum:* ${formatDate(firstDate)} às ${timeLabel}\n\n`;
            }

            if (detailText) {
                text += `*Detalhes do Jejum:*\n${detailText}\n\n`;
            }
        }

        if (hasPrayer && displaySlots.length > 0) {
            text += `🕗 *Relógio de Oração*\n`;
            displaySlots.forEach(t => {
                text += `${t} – Intercessão na igreja\n`;
            });
            text += `\n`;
        }

        text += `Permaneça firme. Seu posicionamento gera resposta no céu. ✨`;
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
                            <div className="text-xs text-slate-500 mt-1">
                                {fastingData?.type} • Início: {fastingData?.time}
                            </div>
                        </div>
                    </div>

                    {savedSlots.length > 0 && (
                        <div className="flex items-start gap-3">
                            <Clock className="text-indigo-400 shrink-0 mt-1" size={18} />
                            <div>
                                <div className="font-bold text-white">Relógio de Oração</div>
                                <div className="text-sm text-slate-300">
                                    {savedSlots.map((t, idx) => (
                                        <div key={idx}>
                                            • {t} {t === '08:00' && <span className="text-xs text-indigo-400 font-medium">(seu horário de intercessão na Igreja)</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={onFinish}
                className="w-full bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-bold py-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
                <span>Finalizar</span>
                <ArrowRight size={20} />
            </button>
        </div>
    );
}
