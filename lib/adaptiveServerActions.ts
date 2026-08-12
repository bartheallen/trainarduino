"use server";

import { createServerSupabaseClient } from '@/lib/supabase';
import * as adaptive from '@/lib/services/adaptiveLearningService';
import * as rec from '@/lib/services/recommendationService';
import * as adaptiveEngine from '@/lib/services/adaptiveEngineService';

export async function getLearningProfileAction() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return adaptive.getLearningProfile(user.id);
}

export async function getRecommendationsAction() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  return rec.listUserRecommendations(user.id);
}

export async function getAdaptiveRecommendationAction() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return adaptiveEngine.recommendAdaptiveActions(user.id);
}

export async function refreshAdaptiveLearningProfileAction() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return adaptiveEngine.refreshAdaptiveLearningProfile(user.id);
}
