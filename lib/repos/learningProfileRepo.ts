import { createServerSupabaseClient } from '@/lib/supabase';
import type { StudentLearningProfile } from '@/lib/types';

export async function getProfileByUserId(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('student_learning_profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return (data as StudentLearningProfile) || null;
}

export async function upsertLearningProfile(userId: string, payload: Partial<StudentLearningProfile>) {
  const supabase = await createServerSupabaseClient();
  const body = { user_id: userId, ...payload };
  const { data, error } = await supabase.from('student_learning_profiles').upsert([body]).select().single();
  if (error) throw error;
  return data as StudentLearningProfile;
}
