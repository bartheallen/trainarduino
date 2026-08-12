/**
 * Learning Path Repository
 * Persists and retrieves learning paths from Supabase
 */

import { createServerSupabaseClient as createServerClient } from '@/lib/supabase';
import type { LearningPath } from '@/lib/pathGeneration/types';

export async function createLearningPath(path: Omit<LearningPath, 'id' | 'createdAt'>) {
  const supabase = await createServerClient();
  const id = `path_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('learning_paths')
    .insert([
      {
        id,
        user_id: path.userId,
        goal: path.goal || null,
        created_at: now,
        estimated_total_minutes: path.estimatedTotalMinutes,
        current_node_index: path.currentNodeIndex,
        nodes: path.nodes,
        metadata: path.metadata,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(`createLearningPath failed: ${error.message}`);
  return {
    ...data,
    createdAt: data.created_at,
    userId: data.user_id,
    estimatedTotalMinutes: data.estimated_total_minutes,
    currentNodeIndex: data.current_node_index,
  } as LearningPath;
}

export async function getCurrentLearningPath(userId: string): Promise<LearningPath | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(`getCurrentLearningPath failed: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    goal: data.goal,
    createdAt: data.created_at,
    estimatedTotalMinutes: data.estimated_total_minutes,
    currentNodeIndex: data.current_node_index,
    nodes: data.nodes,
    metadata: data.metadata,
  } as LearningPath;
}

export async function updatePathProgress(pathId: string, currentNodeIndex: number) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('learning_paths')
    .update({ current_node_index: currentNodeIndex })
    .eq('id', pathId)
    .select()
    .single();

  if (error) throw new Error(`updatePathProgress failed: ${error.message}`);
  return data;
}

export async function listLearningPaths(userId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`listLearningPaths failed: ${error.message}`);
  return (data || []).map((d: any) => ({
    id: d.id,
    userId: d.user_id,
    goal: d.goal,
    createdAt: d.created_at,
    estimatedTotalMinutes: d.estimated_total_minutes,
    currentNodeIndex: d.current_node_index,
    nodes: d.nodes,
    metadata: d.metadata,
  })) as LearningPath[];
}
