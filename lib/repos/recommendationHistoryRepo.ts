import { createServerSupabaseClient } from '@/lib/supabase';
import type { RecommendationHistory, RecommendationFeedback } from '@/lib/types';

export async function recordRecommendation(history: Partial<RecommendationHistory>) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('recommendation_history').insert([history]).select().single();
  if (error) throw error;
  return data as RecommendationHistory;
}

export async function listDecisionHistory(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('recommendation_history').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data as RecommendationHistory[];
}

export async function listDecisionHistoryByRecommendationId(recommendationId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('recommendation_history')
    .select('*')
    .eq('recommendation_id', recommendationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as RecommendationHistory[];
}

export async function getHistoryById(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('recommendation_history').select('*').eq('id', id).single();
  if (error) throw error;
  return data as RecommendationHistory;
}

export async function recordFeedback(feedback: Partial<RecommendationFeedback>) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('recommendation_feedback').insert([feedback]).select().single();
  if (error) throw error;
  return data as RecommendationFeedback;
}

export async function getFeedbackForHistoryId(historyId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('recommendation_feedback')
    .select('*')
    .eq('recommendation_history_id', historyId)
    .maybeSingle();
  if (error) throw error;
  return (data as RecommendationFeedback) || null;
}
