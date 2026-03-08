import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

Deno.serve(async (req) => {
    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        const zapiUrl = Deno.env.get('ZAPI_URL') || ''
        const zapiToken = Deno.env.get('ZAPI_TOKEN') || ''

        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Buscar mensagens pendentes, ordenadas por prioridade (high primeiro) e data de criação
        const { data: queue, error: fetchError } = await supabase
            .from('message_queue')
            .select('*')
            .eq('status', 'pending')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(10) // Processar em pequenos lotes para evitar timeouts

        if (fetchError) throw fetchError
        if (!queue || queue.length === 0) {
            return new Response(JSON.stringify({ message: 'Queue empty' }), { status: 200 })
        }

        console.log(`[ProcessQueue] Processing ${queue.length} messages...`)

        for (let i = 0; i < queue.length; i++) {
            const item = queue[i]

            // Marcar como em processamento para evitar duplicidade
            await supabase.from('message_queue').update({ status: 'sending' }).eq('id', item.id)

            try {
                console.log(`[ProcessQueue] Sending to ${item.phone}...`)

                const response = await fetch(zapiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Client-Token': zapiToken
                    },
                    body: JSON.stringify({
                        phone: item.phone,
                        message: item.content
                    })
                })

                const result = await response.json()

                if (response.ok) {
                    await supabase.from('message_queue').update({
                        status: 'sent',
                        sent_at: new Date().toISOString()
                    }).eq('id', item.id)
                } else {
                    throw new Error(result.message || 'Z-API error')
                }

            } catch (err: any) {
                console.error(`[ProcessQueue] Error sending to ${item.phone}:`, err)
                await supabase.from('message_queue').update({
                    status: 'error',
                    error_message: err.message
                }).eq('id', item.id)
            }

            // Se não for a última mensagem do lote, esperar 30 segundos
            if (i < queue.length - 1) {
                console.log(`[ProcessQueue] Sleeping 30s before next message...`)
                await sleep(30000)
            }
        }

        return new Response(JSON.stringify({ success: true, processed: queue.length }), { status: 200 })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
