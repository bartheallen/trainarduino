import { createServerSupabaseClient as createServerClient } from '@/lib/supabase';
import type { DashboardProjection } from '@/lib/memory/types';

export async function getProjection(userId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('memory_dashboard_projections').select('*').eq('user_id', userId).single();
  if (error && error.code !== 'PGRST116') throw new Error(`getProjection failed: ${error.message}`);
  return data as DashboardProjection | null;
}

export async function upsertProjection(projection: Partial<DashboardProjection> & { user_id: string }) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('memory_dashboard_projections').upsert([projection], { onConflict: 'user_id' }).select().single();
  if (error) throw new Error(`upsertProjection failed: ${error.message}`);
  return data as DashboardProjection;
}
