import { createServerSupabaseClient as createServerClient } from '@/lib/supabase';
import type { KnowledgeConcept } from '@/lib/memory/types';

export async function createConcept(payload: { key: string; title: string; description?: string }) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('concepts').insert([payload]).select().single();
  if (error) throw new Error(`createConcept failed: ${error.message}`);
  return data as KnowledgeConcept;
}

export async function getConceptByKey(key: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('concepts').select('*').eq('key', key).single();
  if (error && error.code !== 'PGRST116') throw new Error(`getConceptByKey failed: ${error.message}`);
  return data as KnowledgeConcept | null;
}

export async function listConcepts() {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('concepts').select('*').order('created_at', { ascending: true });
  if (error) throw new Error(`listConcepts failed: ${error.message}`);
  return data as KnowledgeConcept[];
}

// Backwards-compatible alias
export const getConcepts = listConcepts;

export async function addDependency(concept_id: string, prerequisite_id: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('concept_dependencies').insert([{ concept_id, prerequisite_id }]).select().single();
  if (error) throw new Error(`addDependency failed: ${error.message}`);
  return data;
}

export async function getPrerequisites(conceptId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('concept_dependencies').select('prerequisite_id').eq('concept_id', conceptId);
  if (error) throw new Error(`getPrerequisites failed: ${error.message}`);
  return (data || []).map((r: any) => r.prerequisite_id as string);
}

export async function getDependents(prerequisiteId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('concept_dependencies').select('concept_id').eq('prerequisite_id', prerequisiteId);
  if (error) throw new Error(`getDependents failed: ${error.message}`);
  return (data || []).map((r: any) => r.concept_id as string);
}
