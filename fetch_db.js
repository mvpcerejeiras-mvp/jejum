
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdWd4bGZkdG9uZWx4bGZsa2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjAzMTYsImV4cCI6MjA4NTQ5NjMxNn0.dET3jETBBumJ_zELwErdPsXDJikIucOzoTW8uvyIOq4";
const baseUrl = "https://tlugxlfdtonelxlflkip.supabase.co/rest/v1";

async function run() {
    try {
        console.log('--- SYSTEM CONFIG ---');
        const r1 = await fetch(`${baseUrl}/system_config?select=*`, {
            headers: { "apikey": key, "Authorization": "Bearer " + key }
        });
        console.log(JSON.stringify(await r1.json(), null, 2));

        console.log('\n--- PRAYER CAMPAIGNS ---');
        const r2 = await fetch(`${baseUrl}/prayer_campaigns?select=*`, {
            headers: { "apikey": key, "Authorization": "Bearer " + key }
        });
        console.log(JSON.stringify(await r2.json(), null, 2));
    } catch (e) {
        console.error(e);
    }
}
run();
