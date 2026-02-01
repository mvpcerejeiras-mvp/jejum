
import { supabase } from './supabaseClient';
import { Participant, AppSettings } from '../types';
import { DEFAULT_INSTRUCTION, DEFAULT_THEME, DEFAULT_APP_TITLE, DEFAULT_LOGO, DEFAULT_DAYS } from '../constants';

const SETTINGS_ID_FALLBACK = '00000000-0000-0000-0000-000000000000'; // Not used if we query by simple limit, but good to have constraint conceptualized

export const getParticipants = async (): Promise<Participant[]> => {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching participants:', error);
    return [];
  }

  // Ensure 'days' is array, though Supabase returns it as array if type is text[]
  // Mapping check just in case
  return (data || []).map((p: any) => ({
    ...p,
    createdAt: p.created_at, // Map DB column snake_case to app camelCase
    days: p.days || []
  }));
};

export const saveParticipant = async (participant: Omit<Participant, 'id' | 'createdAt'>): Promise<{ success: boolean; message?: string }> => {
  // Check for duplicate phone
  const { data: existing } = await supabase
    .from('participants')
    .select('id')
    .eq('phone', participant.phone)
    .maybeSingle();

  if (existing) {
    return { success: false, message: 'Este número de WhatsApp já está cadastrado.' };
  }

  const { error } = await supabase
    .from('participants')
    .insert([
      {
        name: participant.name,
        phone: participant.phone,
        days: participant.days,
        time: participant.time,
        type: participant.type,
      }
    ]);

  if (error) {
    console.error('Error saving participant:', error);
    return { success: false, message: 'Erro ao salvar no banco de dados.' };
  }

  return { success: true };
};

export const getSettings = async (): Promise<AppSettings> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    // Return defaults if error or empty (though migration seeded it)
    console.warn('Using default settings due to error or missing data:', error);
    return {
      theme: DEFAULT_THEME,
      instruction: DEFAULT_INSTRUCTION,
      appTitle: DEFAULT_APP_TITLE,
      logoId: DEFAULT_LOGO,
      fastDays: DEFAULT_DAYS,
    };
  }

  return {
    theme: data.theme || DEFAULT_THEME,
    instruction: data.instruction || DEFAULT_INSTRUCTION,
    appTitle: data.app_title || DEFAULT_APP_TITLE, // Map DB snake_case
    logoId: data.logo_id || DEFAULT_LOGO,
    fastDays: data.fast_days || DEFAULT_DAYS,
  };
};

export const saveSettings = async (settings: AppSettings): Promise<{ success: boolean }> => {
  // Update the single row. We don't have the ID handy so we update all/any.
  // Ideally we query ID first or use a known ID.
  // Since we have 1 row, we can just update where true or get the ID first.
  // Let's just use the first row logic again.

  const { data: current } = await supabase
    .from('app_settings')
    .select('id')
    .limit(1)
    .single();

  if (current) {
    const { error } = await supabase
      .from('app_settings')
      .update({
        theme: settings.theme,
        instruction: settings.instruction,
        app_title: settings.appTitle,
        logo_id: settings.logoId,
        fast_days: settings.fastDays,
        updated_at: new Date().toISOString()
      })
      .eq('id', current.id);

    return { success: !error };
  } else {
    // Create if missing (should not happen)
    const { error } = await supabase
      .from('app_settings')
      .insert({
        theme: settings.theme,
        instruction: settings.instruction,
        app_title: settings.appTitle,
        logo_id: settings.logoId,
        fast_days: settings.fastDays
      });
    return { success: !error };
  }
};

export const uploadLogo = async (file: File): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `logo-${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('logos')
    .upload(fileName, file);

  if (error) {
    console.error('Error uploading logo:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('logos')
    .getPublicUrl(fileName);

  return publicUrl;
};