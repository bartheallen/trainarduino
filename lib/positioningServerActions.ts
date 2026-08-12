"use server";

import { createServerSupabaseClient } from '@/lib/supabase';
import * as positioningService from '@/lib/services/positioningTestService';

export async function savePositioningTestResultAction(score: number, totalQuestions: number) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return positioningService.savePositioningTestResult(user.id, score, totalQuestions);
}
