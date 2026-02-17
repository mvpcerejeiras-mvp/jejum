
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdWd4bGZkdG9uZWx4bGZsa2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjAzMTYsImV4cCI6MjA4NTQ5NjMxNn0.dET3jETBBumJ_zELwErdPsXDJikIucOzoTW8uvyIOq4";
const baseUrl = "https://tlugxlfdtonelxlflkip.supabase.co/rest/v1";

async function checkCols(table) {
    try {
        const r = await fetch(`${baseUrl}/${table}?select=*&limit=1`, {
            headers: { "apikey": key, "Authorization": "Bearer " + key }
        });
        if (r.status === 200) {
            const data = await r.json();
            if (data.length > 0) {
                console.log(`--- ${table} ---`);
                console.log(Object.keys(data[0]).join(', '));
            } else {
                console.log(`--- ${table} ---`);
                console.log('EMPTY');
            }
        } else {
            const err = await r.text();
            console.log(`--- ${table} ERROR ${r.status} ---`);
            console.log(err);
        }
    } catch (e) {
        console.error(e);
    }
}

async function run() {
    await checkCols('participants');
    console.log('\n');
    await checkCols('prayer_signups');
    console.log('\n');
    await checkCols('members');
}
run();
