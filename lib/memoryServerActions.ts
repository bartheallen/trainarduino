"use server";

import * as mem from '@/lib/services/memoryEngineService';
import * as daily from '@/lib/services/dailyMemoryUpdater';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function getMemorySnapshotAction() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return mem.getDashboardProjection(user.id);
}

export async function upsertConceptStateAction(payload: any) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return mem.upsertConceptState({ ...payload, user_id: user.id });
}

export async function requestRecommendationFromMemoryAction() {
  // For now return projection which includes weak concepts
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const proj = await mem.getDashboardProjection(user.id);
  return proj?.weak_concepts || [];
}

export async function runDailyMemoryUpdateAction() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return daily.runDailyUpdateForUser(user.id);
}
