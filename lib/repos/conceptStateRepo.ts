import { createServerSupabaseClient as createServerClient } from '@/lib/supabase';
import type { ConceptStateRow } from '@/lib/memory/types';

export async function getConceptState(userId: string, conceptId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('concept_states').select('*').eq('user_id', userId).eq('concept_id', conceptId).single();
  if (error && error.code !== 'PGRST116') throw new Error(`getConceptState failed: ${error.message}`);
  return data as ConceptStateRow | null;
}

export async function listConceptStatesForUser(userId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('concept_states').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
  if (error && error.code !== 'PGRST116') throw new Error(`listConceptStatesForUser failed: ${error.message}`);
  return data as ConceptStateRow[];
}

export async function upsertConceptState(state: Partial<ConceptStateRow> & { user_id: string; concept_id: string; }) {
  const supabase = await createServerClient();
  const payload = { ...state };
  const { data, error } = await supabase.from('concept_states').upsert([payload], { onConflict: 'user_id,concept_id' }).select().single();
  if (error) throw new Error(`upsertConceptState failed: ${error.message}`);
  return data as ConceptStateRow;
}
