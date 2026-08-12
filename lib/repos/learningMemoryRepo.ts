import { createServerSupabaseClient } from '@/lib/supabase';
import type { LearningMemoryRecordRow } from '@/lib/memory/types';

export async function createMemoryRecord(record: Omit<LearningMemoryRecordRow, 'id' | 'created_at'>) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('learning_memory_records')
    .insert([record])
    .select()
    .single();

  if (error) throw error;
  return data as LearningMemoryRecordRow;
}

export async function listMemoryRecordsForUser(userId: string, limit = 50) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('learning_memory_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as LearningMemoryRecordRow[];
}

export async function searchMemoryRecordsForUser(userId: string, query: string, limit = 20) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('learning_memory_records')
    .select('*')
    .eq('user_id', userId)
    .ilike('content', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as LearningMemoryRecordRow[];
}

export async function listMemoryRecordsByType(userId: string, recordType: string, limit = 20) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('learning_memory_records')
    .select('*')
    .eq('user_id', userId)
    .eq('record_type', recordType)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as LearningMemoryRecordRow[];
}

export async function listRecentMistakes(userId: string, limit = 10) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('learning_memory_records')
    .select('*')
    .eq('user_id', userId)
    .in('record_type', ['common_mistake', 'ai_correction'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as LearningMemoryRecordRow[];
}
