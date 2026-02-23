
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tlugxlfdtonelxlflkip.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdWd4bGZkdG9uZWx4bGZsa2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjAzMTYsImV4cCI6MjA4NTQ5NjMxNn0.dET3jETBBumJ_zELwErdPsXDJikIucOzoTW8uvyIOq4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Campaigns ---');
    const { data: campaigns } = await supabase.from('prayer_campaigns').select('*').eq('is_active', true);
    console.log(campaigns);

    console.log('\n--- Participants Count ---');
    const { count } = await supabase.from('participants').select('*', { count: 'exact', head: true });
    console.log('Total Participants:', count);

    console.log('\n--- Recent Logs ---');
    const { data: logs } = await supabase.from('reminder_logs').select('type, target_date, sent_at').order('sent_at', { ascending: false }).limit(5);
    console.log(logs);
}

check();
