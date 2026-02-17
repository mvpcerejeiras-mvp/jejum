
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdWd4bGZkdG9uZWx4bGZsa2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjAzMTYsImV4cCI6MjA4NTQ5NjMxNn0.dET3jETBBumJ_zELwErdPsXDJikIucOzoTW8uvyIOq4";
const baseUrl = "https://tlugxlfdtonelxlflkip.supabase.co/rest/v1";

async function deepDebug() {
    console.log("--- DEBUG PROFUNDO ---");

    // 1. Listar TODOS os participantes
    const r = await fetch(`${baseUrl}/participants?select=*`, {
        headers: { "apikey": key, "Authorization": "Bearer " + key }
    });

    if (r.status !== 200) {
        console.log("Erro ao buscar:", await r.text());
        return;
    }

    const data = await r.json();
    console.log(`Total encontrado no banco: ${data.length}`);

    data.forEach(p => {
        console.log(`ID: ${p.id} | Nome: ${p.name} | Phone: ${p.phone} | MemberID: ${p.member_id}`);
    });

    if (data.length > 0) {
        // Tentar excluir o primeiro apenas para testar RLS de DELETE
        const target = data[0];
        console.log(`\nTestando exlusão do ID: ${target.id} (${target.name})`);

        const del = await fetch(`${baseUrl}/participants?id=eq.${target.id}`, {
            method: 'DELETE',
            headers: {
                "apikey": key,
                "Authorization": "Bearer " + key,
                "Prefer": "return=representation"
            }
        });

        console.log(`Status de Exclusão: ${del.status}`);
        const result = await del.json();
        console.log("Resultado da Exclusão (deve ser o objeto deletado):", result);

        if (result.length === 0) {
            console.log("--- ALERTA: O banco retornou vazio. A exclusão NÃO funcionou (Provável RLS). ---");
        } else {
            console.log("--- SUCESSO: O banco confirmou a exclusão. ---");
        }
    }
}

deepDebug();
