import { createServerSupabaseClient } from '@/lib/supabase';
import type { Project } from '@/lib/types';

export async function getProjectById(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Project;
}

export async function getProjects() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('projects').select('*').order('title', { ascending: true });
  if (error) throw error;
  return data as Project[];
}

export async function createProject(payload: Partial<Project>) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('projects').insert([payload]).select().single();
  if (error) throw error;
  return data as Project;
}
