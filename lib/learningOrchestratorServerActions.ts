"use server";

import * as orchestrator from '@/lib/services/learningOrchestratorService';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function startLearningSessionAction(options: any) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return orchestrator.startSession(user.id, options);
}

export async function getSessionRecommendationsAction(sessionId: string) {
  return orchestrator.generateRecommendationsForSession(sessionId);
}

export async function handleExerciseResultAction(sessionId: string, result: any) {
  return orchestrator.handleExerciseResult(sessionId, result);
}

export async function getProgressSnapshotAction() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return orchestrator.getProgressSnapshot(user.id);
}
