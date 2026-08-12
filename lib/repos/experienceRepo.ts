import { createServerSupabaseClient } from '@/lib/supabase';
import type { Experience } from '../types';

export async function getExperienceById(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('experiences').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Experience;
}

export async function getExperiences() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('experiences').select('*').order('title', { ascending: true });
  if (error) throw error;
  return data as Experience[];
}

export async function createExperience(payload: Partial<Experience>) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('experiences').insert([payload]).select().single();
  if (error) throw error;
  return data as Experience;
}
