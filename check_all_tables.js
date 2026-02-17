
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdWd4bGZkdG9uZWx4bGZsa2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjAzMTYsImV4cCI6MjA4NTQ5NjMxNn0.dET3jETBBumJ_zELwErdPsXDJikIucOzoTW8uvyIOq4";
const baseUrl = "https://tlugxlfdtonelxlflkip.supabase.co/rest/v1";

async function run() {
    try {
        console.log('--- TABLES CHECK ---');
        const tables = ['system_config', 'prayer_campaigns', 'prayer_signups', 'members', 'fasting_history'];
        for (const t of tables) {
            const r = await fetch(`${baseUrl}/${t}?select=count`, {
                headers: { "apikey": key, "Authorization": "Bearer " + key, "Prefer": "count=exact" }
            });
            console.log(`${t}: ${r.status === 200 ? 'OK' : 'ERROR ' + r.status}`);
        }
    } catch (e) {
        console.error(e);
    }
}
run();
