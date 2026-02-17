
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdWd4bGZkdG9uZWx4bGZsa2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjAzMTYsImV4cCI6MjA4NTQ5NjMxNn0.dET3jETBBumJ_zELwErdPsXDJikIucOzoTW8uvyIOq4";
const baseUrl = "https://tlugxlfdtonelxlflkip.supabase.co/rest/v1";

async function cleanup() {
    console.log("--- LIMPANDO DUPLICATAS ---");
    const r = await fetch(`${baseUrl}/participants?select=*`, {
        headers: { "apikey": key, "Authorization": "Bearer " + key }
    });
    const data = await r.json();

    // Agrupar por member_id ou phone + name
    const unique = new Map();
    const toDelete = [];

    data.forEach(p => {
        const keyStr = p.member_id || `${p.phone}-${p.name}`;
        if (unique.has(keyStr)) {
            toDelete.push(p.id);
        } else {
            unique.set(keyStr, p.id);
        }
    });

    console.log(`Encontrados ${data.length} registros. Mantendo ${unique.size}. Excluindo ${toDelete.length}.`);

    for (const id of toDelete) {
        console.log(`Excluindo duplicata ID: ${id}...`);
        await fetch(`${baseUrl}/participants?id=eq.${id}`, {
            method: 'DELETE',
            headers: { "apikey": key, "Authorization": "Bearer " + key }
        });
    }
    console.log("Limpeza concluída!");
}

cleanup();
