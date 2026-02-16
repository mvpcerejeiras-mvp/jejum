
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
    console.log('--- Checking System Config ---');
    const { data: config, error: configErr } = await supabase.from('system_config').select('*');
    console.log('Config rows:', config);
    if (configErr) console.error('Config Error:', configErr);

    console.log('\n--- Checking Prayer Campaigns ---');
    const { data: campaigns, error: campErr } = await supabase.from('prayer_campaigns').select('*');
    console.log('Campaigns:', campaigns);
    if (campErr) console.error('Campaign Error:', campErr);

    console.log('\n--- Checking Signups ---');
    const { data: signups, error: signErr } = await supabase.from('prayer_signups').select('*').limit(5);
    console.log('Recent Signups (limit 5):', signups);
    if (signErr) console.error('Signup Error:', signErr);
}

checkStatus();
