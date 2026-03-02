
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tlugxlfdtonelxlflkip.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdWd4bGZkdG9uZWx4bGZsa2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjAzMTYsImV4cCI6MjA4NTQ5NjMxNn0.dET3jETBBumJ_zELwErdPsXDJikIucOzoTW8uvyIOq4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearLogs() {
    const today = '2026-03-02';
    console.log(`Limpando logs de Jejum para a data: ${today}`);

    const { data, error, count } = await supabase
        .from('reminder_logs')
        .delete({ count: 'exact' })
        .eq('type', 'fasting')
        .eq('target_date', today);

    if (error) {
        console.error('Erro ao deletar:', error);
    } else {
        console.log(`Sucesso! ${count} registros removidos.`);
    }
}

clearLogs();
