
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tlugxlfdtonelxlflkip.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdWd4bGZkdG9uZWx4bGZsa2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjAzMTYsImV4cCI6MjA4NTQ5NjMxNn0.dET3jETBBumJ_zELwErdPsXDJikIucOzoTW8uvyIOq4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const commonNames = [
        'reminder_logs', 'reminder_log', 'reminders', 'logs',
        'app_settings', 'settings', 'system_config',
        'participants', 'members', 'fasting_history',
        'prayer_campaigns', 'prayer_signups'
    ];

    console.log('--- TABLE AVAILABILITY CHECK ---');
    for (const name of commonNames) {
        const { error } = await supabase.from(name).select('count', { count: 'exact', head: true }).limit(0);
        if (error) {
            console.log(`[ ] ${name.padEnd(20)}: ERROR ${error.code} - ${error.message}`);
        } else {
            console.log(`[X] ${name.padEnd(20)}: OK`);
        }
    }
}

check();
