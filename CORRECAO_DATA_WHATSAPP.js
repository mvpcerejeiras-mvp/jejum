
import { createClient } from '@supabase/supabase-js';

// Configurações automáticas extraídas do seu ambiente
const SUPABASE_URL = 'https://tlugxlfdtonelxlflkip.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdWd4bGZkdG9uZWx4bGZsa2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjAzMTYsImV4cCI6MjA4NTQ5NjMxNn0.dET3jETBBumJ_zELwErdPsXDJikIucOzoTW8uvyIOq4';
const ZAPI_INSTANCE = "3EE7F9BBDFF3F155E45CFE9C8F58AF1C";
const ZAPI_TOKEN = "DF5749F6CDD891E19ED684E9";
const SECURITY_TOKEN = "F00812244ef824e12b7faa33658278319S";
const ZAPI_URL = `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`;

// --- AJUSTE AQUI SE PRECISAR ---
const DATA_CERTA = "02 a 06 de Março (segunda a sexta-feira)";
const MENSAGEM = (nome) => `Olá, ${nome}! 📝 Gostaria de fazer uma retificação fundamental: a data informada anteriormente para o nosso propósito de Jejum e Oração estava incorreta.

A data certa é de *02 a 06 de Março* (daqui a uma semana). 

Por favor, anote em sua agenda para estarmos todos unidos neste tempo de consagração. 🙏✨`;

async function enviarCorrecao() {
    console.log("🚀 Iniciando script de retificação...");
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log("🔍 Coletando contatos de Jejum e Relógio de Oração...");
    const [{ data: participants }, { data: signups }] = await Promise.all([
        supabase.from('participants').select('name, phone'),
        supabase.from('prayer_signups').select('*, members(name, phone)')
    ]);

    // Usar Map para evitar duplicidade de envio (se a pessoa estiver em ambos)
    const contatos = new Map();

    participants?.forEach(p => {
        if (p.phone && p.phone.length > 5) {
            contatos.set(p.phone, p.name);
        }
    });

    signups?.forEach(s => {
        if (s.members && s.members.phone && s.members.phone.length > 5) {
            contatos.set(s.members.phone, s.members.name);
        }
    });

    console.log(`✅ ${contatos.size} contatos únicos identificados.`);

    for (const [phone, name] of contatos.entries()) {
        const textoFinal = MENSAGEM(name);

        console.log(`-----------------------------------------`);
        console.log(`DESTINATÁRIO: ${name} (${phone})`);
        console.log(`MENSAGEM: ${textoFinal}`);

        // O ENVIO ESTÁ HABILITADO
        const cleanPhone = phone.replace(/\D/g, "");
        const finalPhone = cleanPhone.startsWith("55") ? cleanPhone : "55" + cleanPhone;

        try {
            const response = await fetch(ZAPI_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Client-Token": SECURITY_TOKEN
                },
                body: JSON.stringify({ phone: finalPhone, message: textoFinal })
            });
            if (response.ok) {
                console.log(">> STATUS: Enviado com sucesso!");
            } else {
                console.log(">> STATUS: Erro no envio.");
            }
        } catch (e) {
            console.log(">> STATUS: Erro de rede.");
        }
    }

    console.log("\n⚠️ FIM DA SIMULAÇÃO.");
    console.log("Para enviar de verdade, edite o arquivo e remova os comentários (/* ... */) do bloco de envio.");
}

enviarCorrecao();
