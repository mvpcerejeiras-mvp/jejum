// Follow this setup guide to integrate the Deno runtime into your application:
// https://supabase.com/docs/guides/functions/connect-to-postgres
import { createClient } from 'https://esm.sh/@supabase/supabase-client@2'

Deno.serve(async (req) => {
    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        const zApiUrl = Deno.env.get('ZAPI_URL') || ''
        const zApiToken = Deno.env.get('ZAPI_TOKEN') || ''

        const supabase = createClient(supabaseUrl, supabaseKey)

        const now = new Date()
        const currentHour = now.getHours()
        const results = { fasting: 0, prayer: 0, errors: [] }

        // 1. LEMBRETES DE JEJUM (20:00 da véspera)
        if (currentHour >= 20) {
            const tomorrow = new Date(now)
            tomorrow.setDate(now.getDate() + 1)
            const dayOfWeek = tomorrow.getDay()
            const daysMap = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
            const searchPrefix = daysMap[dayOfWeek]

            const { data: sets } = await supabase.from('settings').select('fastDays').maybeSingle()
            const tomorrowFullName = sets?.fastDays?.find((d: string) => d.startsWith(searchPrefix))

            if (tomorrowFullName) {
                const { data: participants } = await supabase
                    .from('participants')
                    .select('*, members(id, name, phone)')
                    .contains('days', [tomorrowFullName])

                for (const p of (participants || [])) {
                    const member = p.members
                    if (!member) continue

                    const targetDate = tomorrow.toISOString().split('T')[0]
                    const { data: existingLog } = await supabase
                        .from('reminder_logs')
                        .select('id')
                        .eq('member_id', member.id)
                        .eq('type', 'fasting')
                        .eq('target_date', targetDate)
                        .maybeSingle()

                    if (!existingLog) {
                        const msg = `Olá, ${member.name}! Passando para lembrar do seu Jejum amanhã (${tomorrowFullName.split(' – ')[0]}). Que seja um tempo precioso de consagração! 🔥`
                        const cleanPhone = member.phone.replace(/\D/g, "")
                        const finalPhone = cleanPhone.startsWith("55") ? cleanPhone : "55" + cleanPhone

                        const res = await fetch(zApiUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Client-Token': zApiToken },
                            body: JSON.stringify({ phone: finalPhone, message: msg })
                        })

                        if (res.ok) {
                            await supabase.from('reminder_logs').insert([{
                                member_id: member.id,
                                type: 'fasting',
                                target_date: targetDate
                            }])
                            results.fasting++
                        } else {
                            results.errors.push(`Erro Z-API para ${member.name}`)
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
            .maybeSingle()

        if (campaigns) {
            const startDate = new Date(campaigns.startDate)
            const targetTime = new Date(now.getTime() + 30 * 60000)
            const hoursSinceStart = Math.floor((targetTime.getTime() - startDate.getTime()) / (3600 * 1000))

            if (hoursSinceStart >= 0 && hoursSinceStart < campaigns.duration) {
                const { data: signups } = await supabase
                    .from('prayer_signups')
                    .select('*, members(id, name, phone)')
                    .eq('campaign_id', campaigns.id)
                    .eq('slot_number', hoursSinceStart)

                for (const s of (signups || [])) {
                    const member = s.members
                    if (!member) continue

                    const slotTimeStr = targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    const targetDateKey = `campaign_${campaigns.id}_slot_${hoursSinceStart}`

                    const { data: existingLog } = await supabase
                        .from('reminder_logs')
                        .select('id')
                        .eq('member_id', member.id)
                        .eq('type', 'prayer')
                        .eq('target_date', targetDateKey)
                        .maybeSingle()

                    if (!existingLog) {
                        const msg = `Olá, ${member.name}! Seu horário de intercessão no Relógio de Oração começa em 30 minutos (${slotTimeStr}). Prepare seu coração! 🙏✨`
                        const cleanPhone = member.phone.replace(/\D/g, "")
                        const finalPhone = cleanPhone.startsWith("55") ? cleanPhone : "55" + cleanPhone

                        const res = await fetch(zApiUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Client-Token': zApiToken },
                            body: JSON.stringify({ phone: finalPhone, message: msg })
                        })

                        if (res.ok) {
                            await supabase.from('reminder_logs').insert([{
                                member_id: member.id,
                                type: 'prayer',
                                target_date: targetDateKey
                            }])
                            results.prayer++
                        }
                    }
                }
            }
        }

        return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } })
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
})
