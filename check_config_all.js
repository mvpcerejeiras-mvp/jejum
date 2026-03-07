
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdWd4bGZkdG9uZWx4bGZsa2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjAzMTYsImV4cCI6MjA4NTQ5NjMxNn0.dET3jETBBumJ_zELwErdPsXDJikIucOzoTW8uvyIOq4";
const baseUrl = "https://tlugxlfdtonelxlflkip.supabase.co/rest/v1";

async function run() {
    try {
        console.log('--- ALL SYSTEM CONFIG ROWS ---');
        const r1 = await fetch(`${baseUrl}/system_config?select=*&order=created_at.desc`, {
            headers: { "apikey": key, "Authorization": "Bearer " + key }
        });
        const data = await r1.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
run();
