
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tlugxlfdtonelxlflkip.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdWd4bGZkdG9uZWx4bGZsa2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjAzMTYsImV4cCI6MjA4NTQ5NjMxNn0.dET3jETBBumJ_zELwErdPsXDJikIucOzoTW8uvyIOq4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- reminder_logs columns ---');
    const { data, error } = await supabase.from('reminder_logs').select('*').limit(1);
    if (error) console.error(error);
    if (data && data.length > 0) {
        console.log(Object.keys(data[0]));
    } else {
        console.log('Table is empty, checking schema via RPC or just trying to insert a dummy (rollback not easy here).');
        // Let's try to get columns from a known record or just assume based on other scripts
    }

    console.log('\n--- participants columns ---');
    const { data: pData } = await supabase.from('participants').select('*').limit(1);
    if (pData && pData.length > 0) {
        console.log(Object.keys(pData[0]));
    }
}

check();
