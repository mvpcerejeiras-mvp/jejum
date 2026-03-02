
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tlugxlfdtonelxlflkip.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdWd4bGZkdG9uZWx4bGZsa2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjAzMTYsImV4cCI6MjA4NTQ5NjMxNn0.dET3jETBBumJ_zELwErdPsXDJikIucOzoTW8uvyIOq4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Fetching settings ---');
    const { data: s, error: se } = await supabase.from('settings').select('*').limit(1);
    console.log('settings error:', se?.message);
    console.log('settings data:', s);

    console.log('\n--- Fetching app_settings ---');
    const { data: as, error: ase } = await supabase.from('app_settings').select('*').limit(1);
    console.log('app_settings error:', ase?.message);
    console.log('app_settings data:', as);

    console.log('\n--- Fetching reminder_logs ---');
    const { data: rl, error: rle } = await supabase.from('reminder_logs').select('*').limit(1);
    console.log('reminder_logs error:', rle?.message);
    console.log('reminder_logs data:', rl);
}

check();
