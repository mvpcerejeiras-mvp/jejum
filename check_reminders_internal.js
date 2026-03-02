
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tlugxlfdtonelxlflkip.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdWd4bGZkdG9uZWx4bGZsa2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjAzMTYsImV4cCI6MjA4NTQ5NjMxNn0.dET3jETBBumJ_zELwErdPsXDJikIucOzoTW8uvyIOq4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    try {
        console.log('--- System Settings (fastDays) ---');
        const { data: settings, error: sError } = await supabase.from('settings').select('fastDays').maybeSingle();
        if (sError) console.error('Error fetching settings:', sError);
        console.log('Settings:', settings);

        if (!settings?.fastDays) {
            console.log('No fastDays found in settings.');
            return;
        }

        console.log('\n--- Today (Segunda-feira) Participants ---');
        const todayName = settings.fastDays.find(d => d.startsWith('Segunda-feira'));
        console.log('Today Day Name mapping:', todayName);

        if (todayName) {
            const { data: participants, count, error: pError } = await supabase
                .from('participants')
                .select('id, members(name, phone)', { count: 'exact' })
                .contains('days', [todayName]);

            if (pError) console.error('Error fetching participants:', pError);
            console.log(`Participants count for ${todayName}:`, count);
            if (participants && participants.length > 0) {
                console.log('Sample participants:', participants.slice(0, 3).map(p => p.members?.name));
            }
        } else {
            console.log('No mapping found for Segunda-feira in fastDays.');
        }

        console.log('\n--- Reminder Logs for Target Date 2026-03-02 (Today) ---');
        const { data: logs, error: lError } = await supabase
            .from('reminder_logs')
            .select('*')
            .eq('target_date', '2026-03-02')
            .eq('type', 'fasting');

        if (lError) console.error('Error fetching logs:', lError);
        console.log(`Logs found for target_date 2026-03-02: ${logs?.length || 0}`);
        if (logs && logs.length > 0) {
            console.log('Sample logs:', logs.slice(0, 3));
        }

        console.log('\n--- Most Recent Fasting Logs (Any Date) ---');
        const { data: recentLogs, error: rError } = await supabase
            .from('reminder_logs')
            .select('*')
            .eq('type', 'fasting')
            .order('sent_at', { ascending: false })
            .limit(5);

        if (rError) console.error('Error fetching recent logs:', rError);
        console.log(recentLogs);

    } catch (err) {
        console.error('Script Error:', err);
    }
}

check();
