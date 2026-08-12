import { createServerSupabaseClient } from '@/lib/supabase';
import type { Mission, MissionStep, MissionProgress } from '@/lib/types';

export async function getMissionById(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('missions').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Mission;
}

export async function listMissions() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('missions').select('*').order('title', { ascending: true });
  if (error) throw error;
  return data as Mission[];
}

export async function createMission(payload: Partial<Mission>) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('missions').insert([payload]).select().single();
  if (error) throw error;
  return data as Mission;
}

export async function createMissionStep(payload: Partial<MissionStep>) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('mission_steps').insert([payload]).select().single();
  if (error) throw error;
  return data as MissionStep;
}

export async function getMissionSteps(missionId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('mission_steps').select('*').eq('mission_id', missionId).order('step_index', { ascending: true });
  if (error) throw error;
  return data as MissionStep[];
}

export async function getMissionProgress(userId: string, missionId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('mission_progress').select('*').eq('user_id', userId).eq('mission_id', missionId).maybeSingle();
  if (error) throw error;
  return (data as MissionProgress) || null;
}

export async function startMissionProgress(userId: string, missionId: string) {
  const supabase = await createServerSupabaseClient();
  const payload = {
    user_id: userId,
    mission_id: missionId,
    status: 'in_progress',
    current_step: 0,
    started_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('mission_progress').upsert([payload], { onConflict: 'user_id,mission_id' }).select().single();
  if (error) throw error;
  return data as MissionProgress;
}

export async function updateMissionProgress(userId: string, missionId: string, updates: Partial<MissionProgress>) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('mission_progress').update(updates).eq('user_id', userId).eq('mission_id', missionId).select().single();
  if (error) throw error;
  return data as MissionProgress;
}
