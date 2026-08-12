import { createServerSupabaseClient } from '@/lib/supabase';
import type { Recommendation } from '@/lib/types';

export async function createRecommendation(userId: string | null, type: string, payload: any, score = 0) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('recommendations').insert([{ user_id: userId, type, payload, score }]).select().single();
  if (error) throw error;
  return data as Recommendation;
}

export async function listRecommendationsForUser(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('recommendations').select('*').eq('user_id', userId).order('generated_at', { ascending: false });
  if (error) throw error;
  return data as Recommendation[];
}

export async function recordFeedbackForRecommendation(historyId: string, userId: string, feedbackText: string, rating: number | null) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('recommendation_feedback')
    .insert([{ recommendation_id: historyId, user_id: userId, feedback_text: feedbackText, rating }])
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return true;
}
