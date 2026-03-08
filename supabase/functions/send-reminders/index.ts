// Follow this setup guide to integrate the Deno runtime into your application:
// https://supabase.com/docs/guides/functions/connect-to-postgres
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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

        // 1. LEMBRETES DE JEJUM (20:00 da véspera ou manhã cedo)
        // Verificamos por lembretes se for noite (para amanhã) ou manhã (para hoje)
        const isEvening = currentHour >= 20
        const isMorning = currentHour < 10

        if (isEvening || isMorning) {
            const targetDateObj = new Date(now)
            if (isEvening) {
                targetDateObj.setDate(now.getDate() + 1)
            }

            const dayOfWeek = targetDateObj.getDay()
            const daysMap = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
            const searchPrefix = daysMap[dayOfWeek]

            const { data: sets } = await supabase.from('app_settings').select('fast_days').maybeSingle()
            const targetDayFullName = sets?.fast_days?.find((d: string) => d.startsWith(searchPrefix))

            if (targetDayFullName) {
                const { data: participants } = await supabase
                    .from('participants')
                    .select('*, members(id, name, phone)')
                    .contains('days', [targetDayFullName])

                let firstFasting = true
                for (const p of (participants || [])) {
                    if (!firstFasting) await sleep(30000)
                    firstFasting = false

                    const member = p.members
                    if (!member || !member.phone) continue

                    const targetDateStr = targetDateObj.toISOString().split('T')[0]
                    const { data: existingLog } = await supabase
                        .from('reminder_logs')
                        .select('id')
                        .eq('member_id', member.id)
                        .eq('type', 'fasting')
                        .eq('target_date', targetDateStr)
                        .maybeSingle()

                    if (!existingLog) {
                        const dayLabel = targetDayFullName.split(' – ')[0]
                        const msg = isEvening
                            ? `Olá, ${member.name}! Passando para lembrar do seu Jejum amanhã (${dayLabel}). Que seja um tempo precioso de consagração! 🔥`
                            : `Olá, ${member.name}! Passando para lembrar que hoje é seu dia de Jejum (${dayLabel}). Que seja um tempo precioso de consagração! 🔥`

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
                                target_date: targetDateStr
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
            .eq('is_active', true)
            .maybeSingle()

        if (campaigns) {
            const PRAYER_SLOT_NAMES = [
                'Shalom', 'Rhema', 'Ágape', 'Logos', 'Kairós', 'El Shaddai',
                'Adonai', 'Hosana', 'Aleluia', 'Maranata', 'Emmanuel', 'Shekinah'
            ]
            const startDate = new Date(campaigns.start_date)
            // Olhamos 30 minutos no futuro
            const targetTime = new Date(now.getTime() + 30 * 60000)
            const hoursSinceStart = Math.floor((targetTime.getTime() - startDate.getTime()) / (3600 * 1000))

            if (hoursSinceStart >= 0 && hoursSinceStart < campaigns.duration) {
                const { data: signups } = await supabase
                    .from('prayer_signups')
                    .select('*, members(id, name, phone)')
                    .eq('campaign_id', campaigns.id)
                    .eq('slot_number', hoursSinceStart)

                let firstPrayer = true
                for (const s of (signups || [])) {
                    if (!firstPrayer) await sleep(30000)
                    firstPrayer = false

                    const member = s.members
                    if (!member || !member.phone) continue

                    const slotTimeStr = targetTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Porto_Velho' })
                    const slotName = PRAYER_SLOT_NAMES[hoursSinceStart % 12]
                    const targetDateKey = `campaign_${campaigns.id}_slot_${hoursSinceStart}`

                    const { data: existingLog } = await supabase
                        .from('reminder_logs')
                        .select('id')
                        .eq('member_id', member.id)
                        .eq('type', 'prayer')
                        .eq('target_date', targetDateKey)
                        .maybeSingle()

                    if (!existingLog) {
                        const msg = `Olá, ${member.name}! Seu horário de intercessão no Relógio de Oração (${slotName}) começa em 30 minutos (${slotTimeStr}). Prepare seu coração! 🙏✨`
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
