import { createServerSupabaseClient } from '@/lib/supabase';

type ConversationMessageRecord = {
  id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  topic?: string | null;
  message: string;
  metadata: Record<string, any>;
  created_at: string;
};

export async function recordConversationMessage(
  userId: string,
  role: 'user' | 'assistant' | 'system',
  message: string,
  topic?: string,
  metadata: Record<string, any> = {}
) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('ai_conversations')
    .insert([
      {
        user_id: userId,
        role,
        topic: topic || null,
        message,
        metadata,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as ConversationMessageRecord;
}

export async function listConversationHistory(userId: string, limit = 50, topic?: string) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from('ai_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (topic) {
    query = query.eq('topic', topic);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ConversationMessageRecord[];
}
