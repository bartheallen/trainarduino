import { createServerSupabaseClient } from '@/lib/supabase';
import type { Skill } from '@/lib/types';

export async function getSkillById(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('skills').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Skill;
}

export async function getSkills() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('skills').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data as Skill[];
}

export async function createSkill(payload: Partial<Skill>) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('skills').insert([payload]).select().single();
  if (error) throw error;
  return data as Skill;
}
