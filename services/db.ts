
import { supabase } from './supabaseClient';
import { Participant, AppSettings, Member, FastingHistory, PrayerCampaign, PrayerSignup, SystemConfig } from '../types';
import { DEFAULT_INSTRUCTION, DEFAULT_THEME, DEFAULT_APP_TITLE, DEFAULT_LOGO, DEFAULT_DAYS } from '../constants';

export const getSystemConfig = async (): Promise<{ eventMode: 'fasting' | 'prayer_clock' | 'combined' }> => {
  const { data, error } = await supabase
    .from('system_config')
    .select('event_mode')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { eventMode: 'fasting' };
  }

  return { eventMode: data.event_mode as any };
};

export const saveSystemConfig = async (mode: 'fasting' | 'prayer_clock' | 'combined'): Promise<{ success: boolean }> => {
  // Always use the latest config row if multiple exist for some reason
  const { data: current } = await supabase.from('system_config').select('id').order('created_at', { ascending: false }).limit(1).maybeSingle();

  if (current) {
    const { error } = await supabase.from('system_config').update({ event_mode: mode }).eq('id', current.id);
    return { success: !error };
  } else {
    const { error } = await supabase.from('system_config').insert({ event_mode: mode });
    return { success: !error };
  }
};

export const checkMemberByPhone = async (phone: string): Promise<Member | null> => {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    createdAt: data.created_at
  };
};

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

export const deleteParticipant = async (id: string): Promise<{ success: boolean; message?: string }> => {
  const { error, count } = await supabase
    .from('participants')
    .delete({ count: 'exact' }) // Request exact count of deleted rows
    .eq('id', id);

  if (error) {
    console.error('Error deleting participant:', error);
    return { success: false, message: 'Erro ao excluir participant.' };
  }

  if (count === 0) {
    return { success: false, message: 'Erro: Não foi possível excluir. Verifique as permissões ou se o item já foi removido.' };
  }

  return { success: true };
};

export const updateParticipant = async (id: string, data: Partial<Participant>): Promise<{ success: boolean; message?: string }> => {
  const { error } = await supabase
    .from('participants')
    .update({
      name: data.name,
      phone: data.phone,
      days: data.days,
      time: data.time,
      type: data.type
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating participant:', error);
    return { success: false, message: 'Erro ao atualizar participante.' };
  }
  return { success: true };
};

// --- Members CRUD ---

export const getMembers = async (): Promise<Member[]> => {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching members:', error);
    return [];
  }

  return (data || []).map((m: any) => ({
    id: m.id,
    name: m.name,
    phone: m.phone,
    createdAt: m.created_at
  }));
};

export const saveMember = async (member: Omit<Member, 'id' | 'createdAt'>): Promise<{ success: boolean; message?: string }> => {
  // Check duplicate phone
  const { data: existing } = await supabase
    .from('members')
    .select('id')
    .eq('phone', member.phone)
    .maybeSingle();

  if (existing) {
    return { success: false, message: 'Este número já está cadastrado como membro.' };
  }

  const { error } = await supabase
    .from('members')
    .insert([{ name: member.name, phone: member.phone }]);

  if (error) {
    console.error('Error saving member:', error);
    return { success: false, message: 'Erro ao salvar membro.' };
  }
  return { success: true };
};

export const updateMember = async (id: string, data: Partial<Member>): Promise<{ success: boolean; message?: string }> => {
  const { error } = await supabase
    .from('members')
    .update({ name: data.name, phone: data.phone })
    .eq('id', id);

  if (error) {
    console.error('Error updating member:', error);
    return { success: false, message: 'Erro ao atualizar membro.' };
  }
  return { success: true };
};

export const deleteMember = async (id: string): Promise<{ success: boolean; message?: string }> => {
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting member:', error);
    return { success: false, message: 'Erro ao excluir membro.' };
  }
  return { success: true };
};

export const migrateParticipantsToMembers = async (): Promise<{ success: boolean; message: string; count?: number }> => {
  // 1. Get all participants
  const participants = await getParticipants();

  if (participants.length === 0) {
    return { success: true, message: 'Nenhum participante encontrado para migrar.' };
  }

  // 2. Get all existing members phone numbers to avoid duplicates
  const { data: existingMembers, error } = await supabase
    .from('members')
    .select('phone');

  if (error) {
    console.error('Error fetching members for migration:', error);
    return { success: false, message: 'Erro ao verificar membros existentes.' };
  }

  const existingPhones = new Set(existingMembers?.map((m: any) => m.phone));

  // 3. Filter unique participants not already in members
  const newMembersMap = new Map<string, string>(); // Phone -> Name (Use Map to deduplicate participants with same phone)

  participants.forEach(p => {
    // Only add if not in existing members and not already drafted for this batch
    if (!existingPhones.has(p.phone)) {
      newMembersMap.set(p.phone, p.name);
    }
  });

  if (newMembersMap.size === 0) {
    return { success: true, message: 'Todos os participantes já estão cadastrados como membros.' };
  }

  const membersToInsert = Array.from(newMembersMap.entries()).map(([phone, name]) => ({
    name,
    phone
  }));

  // 4. Batch Insert
  const { error: insertError } = await supabase
    .from('members')
    .insert(membersToInsert);

  if (insertError) {
    console.error('Error migrating members:', insertError);
    return { success: false, message: 'Erro ao migrar participantes.' };
  }

  return { success: true, message: 'Migração concluída com sucesso!', count: membersToInsert.length };
};

export const deleteAllMembers = async (): Promise<{ success: boolean; message: string }> => {
  const { error } = await supabase
    .from('members')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows (neq a non-existent ID is a common pattern to delete all)

  if (error) {
    console.error('Error deleting all members:', error);
    return { success: false, message: 'Erro ao excluir todos os membros.' };
  }
  return { success: true, message: 'Todos os membros foram excluídos.' };
};

export const archiveCurrentFast = async (eventName: string): Promise<{ success: boolean; message: string; archivedCount?: number }> => {
  // 1. Get all participants
  const participants = await getParticipants();

  if (participants.length === 0) {
    return { success: false, message: 'Não há participantes para arquivar.' };
  }

  // 2. Sync to Members First (Ensure everyone has a member_id)
  const syncRes = await migrateParticipantsToMembers();
  if (!syncRes.success) {
    return { success: false, message: 'Erro ao sincronizar membros antes de arquivar: ' + syncRes.message };
  }

  // 3. Get all Members to map Phone -> ID
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('id, phone');

  if (membersError || !members) {
    console.error('Error fetching members for archiving:', membersError);
    return { success: false, message: 'Erro ao buscar dados de membros.' };
  }

  const phoneToMemberId = new Map<string, string>();
  members.forEach((m: any) => phoneToMemberId.set(m.phone, m.id));

  // 4. Prepare History Data
  const historyEntries = participants
    .map(p => {
      const memberId = phoneToMemberId.get(p.phone);
      if (!memberId) return null; // Should not happen if sync succeeded
      return {
        member_id: memberId,
        event_name: eventName,
        days: p.days,
        type: p.type,
      };
    })
    .filter(entry => entry !== null);

  if (historyEntries.length === 0) {
    return { success: false, message: 'Erro interno: Falha ao mapear participantes para membros.' };
  }

  // 5. Insert History
  const { error: historyError } = await supabase
    .from('fasting_history')
    .insert(historyEntries);

  if (historyError) {
    console.error('Error writing history:', historyError);
    return { success: false, message: 'Erro ao salvar histórico.' };
  }

  // 6. Clear Participants
  // We use the same deleteAllMembers logic but for participants table
  const { error: deleteError } = await supabase
    .from('participants')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteError) {
    console.error('Error clearing participants:', deleteError);
    return { success: false, message: 'Histórico salvo, mas erro ao limpar lista de participantes.' };
  }

  return { success: true, message: 'Jejum encerrado com sucesso! Histórico salvo e lista limpa.', archivedCount: historyEntries.length };
};

export const getMemberHistory = async (memberId: string): Promise<FastingHistory[]> => {
  const { data, error } = await supabase
    .from('fasting_history')
    .select('*')
    .eq('member_id', memberId)
    .order('archived_at', { ascending: false });

  if (error) {
    console.error('Error fetching member history:', error);
    return [];
  }

  return (data || []).map((h: any) => ({
    id: h.id,
    memberId: h.member_id,
    eventName: h.event_name,
    days: h.days || [],
    type: h.type,
    archivedAt: h.archived_at
  }));
};

// --- Prayer Clock ---

export const createPrayerCampaign = async (campaign: Omit<PrayerCampaign, 'id' | 'createdAt' | 'isActive'>): Promise<{ success: boolean; message?: string }> => {
  const { error } = await supabase
    .from('prayer_campaigns')
    .insert([{
      title: campaign.title,
      description: campaign.description,
      start_date: campaign.startDate,
      duration: campaign.duration,
      is_active: true
    }]);

  if (error) {
    console.error('Error creating prayer campaign:', error);
    return { success: false, message: 'Erro ao criar campanha.' };
  }
  return { success: true };
};

export const getPrayerCampaigns = async (): Promise<PrayerCampaign[]> => {
  const { data, error } = await supabase
    .from('prayer_campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching prayer campaigns:', error);
    return [];
  }

  return (data || []).map((c: any) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    startDate: c.start_date,
    duration: c.duration,
    isActive: c.is_active,
    createdAt: c.created_at
  }));
};

export const toggleCampaignStatus = async (id: string, isActive: boolean): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('prayer_campaigns')
    .update({ is_active: isActive })
    .eq('id', id);

  return { success: !error };
};

export const deleteCampaign = async (id: string): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('prayer_campaigns')
    .delete()
    .eq('id', id);

  return { success: !error };
}

export const getPrayerSignups = async (campaignId: string): Promise<PrayerSignup[]> => {
  const { data, error } = await supabase
    .from('prayer_signups')
    .select(`
      *,
      member:members(name, phone)
    `)
    .eq('campaign_id', campaignId);

  if (error) {
    console.error('Error fetching signups:', error);
    return [];
  }

  return (data || []).map((s: any) => ({
    id: s.id,
    campaignId: s.campaign_id,
    memberId: s.member_id,
    slotNumber: s.slot_number,
    createdAt: s.created_at,
    member: s.member
  }));
};

export const addPrayerSignup = async (campaignId: string, memberId: string, slotNumber: number): Promise<{ success: boolean; message?: string }> => {
  // 1. Fetch all signups to calculate state
  // We need to know if we are in "Phase Extra" (all slots >= 7)
  const signups = await getPrayerSignups(campaignId);

  // Check if user already signed up for THIS slot
  const alreadyInSlot = signups.find(s => s.memberId === memberId && s.slotNumber === slotNumber);
  if (alreadyInSlot) {
    return { success: false, message: 'Você já está inscrito neste horário.' };
  }

  // Get campaign details to know duration
  const { data: campaign } = await supabase
    .from('prayer_campaigns')
    .select('duration')
    .eq('id', campaignId)
    .single();

  if (!campaign) return { success: false, message: 'Campanha não encontrada.' };

  const duration = campaign.duration;

  // Count per slot
  const slotCounts = new Array(duration).fill(0);
  signups.forEach(s => {
    if (s.slotNumber < duration) {
      slotCounts[s.slotNumber]++;
    }
  });

  // Check Phase 1 Complete (All slots >= 7)
  const isPhase1Complete = slotCounts.every(count => count >= 7);

  const currentSlotCount = slotCounts[slotNumber];

  // Logic:
  // If count < 7: Allow
  // If count >= 7 AND Phase1Complete AND count < 10: Allow
  // Else: Full

  if (currentSlotCount < 7) {
    // OK
  } else if (currentSlotCount >= 7) {
    if (!isPhase1Complete) {
      return { success: false, message: 'Este horário está cheio (7 pessoas). Aguarde todos os horários completarem para abrir vagas extras.' };
    }
    if (currentSlotCount >= 10) {
      return { success: false, message: 'Este horário atingiu o limite máximo absoluto (10 pessoas).' };
    }
    // OK (Phase 1 complete, count < 10)
  }

  const { error } = await supabase
    .from('prayer_signups')
    .insert([{
      campaign_id: campaignId,
      member_id: memberId,
      slot_number: slotNumber
    }]);

  if (error) {
    console.error('Error adding signup:', error);
    return { success: false, message: 'Erro ao realizar inscrição.' };
  }

  return { success: true };
};