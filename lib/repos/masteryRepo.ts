import { createServerSupabaseClient as createServerClient } from '@/lib/supabase';
import type { MasteryHistory } from '@/lib/memory/types';

export async function recordMastery(history: Omit<MasteryHistory, 'id' | 'created_at'>) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('concept_mastery_history').insert([history]).select().single();
  if (error) throw new Error(`recordMastery failed: ${error.message}`);
  return data as MasteryHistory;
}

export async function listMasteryHistory(userId: string, conceptId?: string) {
  const supabase = await createServerClient();
  let q = supabase.from('concept_mastery_history').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (conceptId) q = q.eq('concept_id', conceptId);
  const { data, error } = await q;
  if (error) throw new Error(`listMasteryHistory failed: ${error.message}`);
  return data as MasteryHistory[];
}
