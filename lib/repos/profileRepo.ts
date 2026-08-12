import { createServerSupabaseClient } from '@/lib/supabase';
import { Profile } from '@/lib/types';

export async function getProfileById(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Profile;
}

export async function getProfileByUsername(username: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('profiles').select('*').eq('username', username).maybeSingle();
  if (error) throw error;
  return (data as Profile) || null;
}

export async function upsertProfile(id: string, payload: Partial<Profile>) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('profiles').upsert({ id, ...payload }).select().single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(id: string, payload: Partial<Profile>) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('profiles').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data as Profile;
}
