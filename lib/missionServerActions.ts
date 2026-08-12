"use server";

import * as missionService from '@/lib/services/missionService';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function startMissionAction(missionId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return missionService.startMission(user.id, missionId);
}

export async function updateMissionProgressAction(missionId: string, updates: any) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return missionService.updateProgress(user.id, missionId, updates);
}
