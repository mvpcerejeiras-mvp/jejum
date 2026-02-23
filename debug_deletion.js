
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tlugxlfdtonelxlflkip.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdWd4bGZkdG9uZWx4bGZsa2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjAzMTYsImV4cCI6MjA4NTQ5NjMxNn0.dET3jETBBumJ_zELwErdPsXDJikIucOzoTW8uvyIOq4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debug() {
    console.log('--- Buscando Participantes (Deep Check) ---');
    const { data: participants, error } = await supabase
        .from('participants')
        .select('*');

    if (error) {
        console.error('Erro:', error);
        return;
    }

    console.log(`Total de participantes: ${participants.length}`);

    // 1. Check by member_id
    const memberCounts = {};
    participants.forEach(p => {
        if (p.member_id) {
            if (!memberCounts[p.member_id]) memberCounts[p.member_id] = [];
            memberCounts[p.member_id].push(p.id);
        }
    });

    console.log('--- Verificando Duplicatas por member_id ---');
    let hasMemberDuplicates = false;
    for (const [mid, ids] of Object.entries(memberCounts)) {
        if (ids.length > 1) {
            console.log(`MÚLTIPLOS PARTICIPANTES PARA MEMBER_ID: ${mid}`);
            ids.forEach(id => {
                const p = participants.find(part => part.id === id);
                console.log(` - ID: ${id} | Nome: ${p.name} | Criado em: ${p.created_at}`);
            });
            hasMemberDuplicates = true;
        }
    }

    // 2. Check by phone similarity (stripping mask)
    const phoneCounts = {};
    participants.forEach(p => {
        const cleanPhone = p.phone.replace(/\D/g, '');
        if (!phoneCounts[cleanPhone]) phoneCounts[cleanPhone] = [];
        phoneCounts[cleanPhone].push(p.id);
    });

    console.log('--- Verificando Duplicatas por Telefone (apenas números) ---');
    for (const [phone, ids] of Object.entries(phoneCounts)) {
        if (ids.length > 1) {
            console.log(`DUPLICATA POR TELEFONE: ${phone}`);
            ids.forEach(id => {
                const p = participants.find(part => part.id === id);
                console.log(` - ID: ${id} | Nome: ${p.name} | Criado em: ${p.created_at}`);
            });
        }
    }

    // 3. Show all for context
    console.log('--- Dump Completo ---');
    participants.forEach(p => {
        console.log(`ID: ${p.id} | Name: ${p.name} | Phone: ${p.phone} | member_id: ${p.member_id}`);
    });
}

debug();
