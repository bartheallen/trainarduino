import { createServerSupabaseClient } from '@/lib/supabase';
import type { EvaluationResult } from '@/lib/ai/types';

export async function createAIEvaluation(
  submissionId: number,
  modelName: string,
  promptUsed: string,
  evaluationResult: EvaluationResult,
  score: number,
  suggestions: string[],
  tokensUsed: number,
  costCents: number
) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('ai_evaluations').insert([
    {
      submission_id: submissionId,
      model_name: modelName,
      prompt_used: promptUsed,
      evaluation_result: evaluationResult,
      score,
      suggestions,
      tokens_used: tokensUsed,
      cost_cents: costCents,
    },
  ]).select().single();
  if (error) throw error;
  return data;
}

export async function listAIEvaluationsForSubmission(submissionId: number) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('ai_evaluations').select('*').eq('submission_id', submissionId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
