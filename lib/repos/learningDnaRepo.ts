import { createServerSupabaseClient as createServerClient } from '@/lib/supabase';
import type { LearningDNA } from '@/lib/memory/types';

export async function getLearningDNA(userId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('learning_dna').select('*').eq('user_id', userId).single();
  if (error && error.code !== 'PGRST116') throw new Error(`getLearningDNA failed: ${error.message}`);
  return data as LearningDNA | null;
}

export async function upsertLearningDNA(userId: string, traits: Record<string, any>) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('learning_dna').upsert([{ user_id: userId, traits }], { onConflict: 'user_id' }).select().single();
  if (error) throw new Error(`upsertLearningDNA failed: ${error.message}`);
  return data as LearningDNA;
}
