"use server";

import { createServerSupabaseClient } from '@/lib/supabase';
import * as engine from '@/lib/services/recommendationEngineService';
import * as recRepo from '@/lib/repos/recommendationRepo';

export async function getTopRecommendationsAction(limit = 5) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  // For now, candidates are missions + projects + exercises; fetch simple list
  const candidates: Array<{ id: string; type: string; payload?: any }> = [];
  const top = await engine.generateTopRecommendations(user?.id ?? null, candidates);
  return top.slice(0, limit);
}

export async function listRecommendationsAction() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  return recRepo.listRecommendationsForUser(user.id);
}

export async function submitRecommendationFeedbackAction(userId: string, feedbackText: string, rating: number | null) {
  // Minimal stub for feedback submission until the full feature is implemented.
  console.info('[recommendationServerActions] submitRecommendationFeedbackAction called', {
    userId,
    feedbackText,
    rating,
  });
  return { success: true };
}
