import { createServerSupabaseClient } from '@/lib/supabase';
import type { DashboardProjection } from '@/lib/types';

export async function getDashboardProjection(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('dashboard_projections').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return (data as DashboardProjection) || null;
}

export async function upsertDashboardProjection(userId: string, payload: Partial<DashboardProjection>) {
  const supabase = await createServerSupabaseClient();
  const body = { user_id: userId, ...payload };
  const { data, error } = await supabase.from('dashboard_projections').upsert([body], { onConflict: 'user_id' }).select().single();
  if (error) throw error;
  return data as DashboardProjection;
}
