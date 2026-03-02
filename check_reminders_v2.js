
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tlugxlfdtonelxlflkip.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdWd4bGZkdG9uZWx4bGZsa2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjAzMTYsImV4cCI6MjA4NTQ5NjMxNn0.dET3jETBBumJ_zELwErdPsXDJikIucOzoTW8uvyIOq4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    try {
        console.log('--- System Settings (app_settings) ---');
        const { data: settings, error: sError } = await supabase.from('app_settings').select('*').maybeSingle();
        if (sError) console.error('Error fetching settings:', sError);
        console.log('Settings:', settings);

        if (!settings?.fast_days) {
            console.log('No fast_days found in settings.');
            // Let's check if they are in fastDays (camelCase)
            if (settings?.fastDays) console.log('Found camelCase fastDays instead:', settings.fastDays);
            else return;
        }

        const fastDays = settings.fast_days || settings.fastDays;

        console.log('\n--- Today (Segunda-feira) Participants ---');
        // Get day of week for March 2nd, 2026 (Monday)
        const date = new Date('2026-03-02');
        const dayOfWeek = date.getDay(); // 1 for Monday
        const daysMap = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const searchPrefix = daysMap[dayOfWeek];

        const todayName = fastDays.find(d => d.startsWith(searchPrefix));
        console.log(`Searching for: ${searchPrefix}`);
        console.log('Mapping found:', todayName);

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
        }

        console.log('\n--- Reminder Logs for Target Date 2026-03-02 (Today) ---');
        const { data: logs } = await supabase
            .from('reminder_logs')
            .select('*')
            .eq('target_date', '2026-03-02')
            .eq('type', 'fasting');

        console.log(`Logs found for 2026-03-02: ${logs?.length || 0}`);

    } catch (err) {
        console.error('Script Error:', err);
    }
}

check();
