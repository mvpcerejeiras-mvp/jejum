import { supabase } from './supabaseClient';
import { sendWhatsAppMessage } from './whatsapp';
import { FastDay } from '../types';

/**
 * Serviço de Lembretes Automáticos
 * Esta lógica será executada periodicamente (ex: cada 30min)
 */

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const processReminders = async () => {
    const results = {
        fastingReminders: 0,
        prayerReminders: 0,
        errors: [] as string[]
    };

    try {
        const now = new Date();
        const currentHour = now.getHours();
        let totalSent = 0;

        // 1. LEMBRETES DE JEJUM
        const isEvening = currentHour >= 20;
        const isMorningManual = currentHour < 12;

        if (isEvening || isMorningManual) {
            const targetDateObj = new Date(now);
            if (isEvening) {
                targetDateObj.setDate(now.getDate() + 1);
            }

            const targetDayName = await findActiveDayName(targetDateObj);

            if (targetDayName) {
                const { data: participants } = await supabase
                    .from('participants')
                    .select('*, members(id, name, phone)')
                    .contains('days', [targetDayName]);

                for (const p of (participants || [])) {
                    const member = p.members;
                    if (!member) continue;

                    const targetDateStr = targetDateObj.toISOString().split('T')[0];
                    const { data: existingLog } = await supabase
                        .from('reminder_logs')
                        .select('id')
                        .eq('member_id', member.id)
                        .eq('type', 'fasting')
                        .eq('target_date', targetDateStr)
                        .maybeSingle();

                    if (!existingLog) {
                        // Delay antes de enviar (exceto o primeiro de todos no process completo)
                        if (totalSent > 0) {
                            if (totalSent % 10 === 0) {
                                await delay(60000); // Pausa de 60s a cada 10
                            } else {
                                // 10-120s aleatório
                                await delay(Math.floor(Math.random() * (120000 - 10000 + 1)) + 10000);
                            }
                        }

                        const dayLabel = targetDayName.split(' – ')[0];
                        const msg = isEvening
                            ? `Olá, ${member.name}! Passando para lembrar do seu Jejum amanhã (${dayLabel}). Que seja um tempo precioso de consagração! 🔥`
                            : `Olá, ${member.name}! Passando para lembrar que hoje é seu dia de Jejum (${dayLabel}). Que seja um tempo precioso de consagração! 🔥`;

                        const res = await sendWhatsAppMessage(member.phone, msg);

                        if (res.success) {
                            await supabase.from('reminder_logs').insert([{
                                member_id: member.id,
                                type: 'fasting',
                                target_date: targetDateStr
                            }]);
                            results.fastingReminders++;
                            totalSent++;
                        } else {
                            results.errors.push(`Erro ao enviar lembrete de jejum para ${member.name}: ${res.message}`);
                        }
                    }
                }
            }
        }

        // 2. LEMBRETES DE ORAÇÃO (30 min antes)
        const { data: campaigns } = await supabase
            .from('prayer_campaigns')
            .select('*')
            .eq('isActive', true)
            .maybeSingle();

        if (campaigns) {
            const startDate = new Date(campaigns.startDate);
            const targetTime = new Date(now.getTime() + 30 * 60000);
            const hoursSinceStart = Math.floor((targetTime.getTime() - startDate.getTime()) / (3600 * 1000));

            if (hoursSinceStart >= 0 && hoursSinceStart < campaigns.duration) {
                const { data: signups } = await supabase
                    .from('prayer_signups')
                    .select('*, members(id, name, phone)')
                    .eq('campaign_id', campaigns.id)
                    .eq('slot_number', hoursSinceStart);

                for (const s of (signups || [])) {
                    const member = s.members;
                    if (!member) continue;

                    const targetDateKey = `campaign_${campaigns.id}_slot_${hoursSinceStart}`;

                    const { data: existingLog } = await supabase
                        .from('reminder_logs')
                        .select('id')
                        .eq('member_id', member.id)
                        .eq('type', 'prayer')
                        .eq('target_date', targetDateKey)
                        .maybeSingle();

                    if (!existingLog) {
                        // Delay antes de enviar (considerando totalSent acumulado)
                        if (totalSent > 0) {
                            if (totalSent % 10 === 0) {
                                await delay(60000);
                            } else {
                                await delay(Math.floor(Math.random() * (120000 - 10000 + 1)) + 10000);
                            }
                        }

                        const slotTimeStr = targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const msg = `Olá, ${member.name}! Seu horário de intercessão no Relógio de Oração começa em 30 minutos (${slotTimeStr}). Prepare seu coração! 🙏✨`;
                        const res = await sendWhatsAppMessage(member.phone, msg);

                        if (res.success) {
                            await supabase.from('reminder_logs').insert([{
                                member_id: member.id,
                                type: 'prayer',
                                target_date: targetDateKey
                            }]);
                            results.prayerReminders++;
                            totalSent++;
                        } else {
                            results.errors.push(`Erro ao enviar lembrete de oração para ${member.name}: ${res.message}`);
                        }
                    }
                }
            }
        }

    } catch (error: any) {
        console.error('Reminder Processing Error:', error);
        results.errors.push(error.message);
    }

    return results;
};

// Auxiliar para converter Date em Nome do Dia (Enum FastDay)
// Busca o dia ativo nas configurações do sistema que começa com o nome do dia da semana
async function findActiveDayName(date: Date): Promise<string | null> {
    const dayOfWeek = date.getDay();
    const daysMap = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const searchPrefix = daysMap[dayOfWeek];

    const { data: sets } = await supabase.from('app_settings').select('fast_days').maybeSingle();
    if (!sets?.fast_days) return null;

    // Encontrar o dia nas configurações que começa com o nome do dia da semana atual
    return sets.fast_days.find((d: string) => d.startsWith(searchPrefix)) || null;
}
