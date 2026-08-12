import type { Exercise } from '@/lib/types';
import type { EvaluationContext, EvaluationResult } from '@/lib/ai/types';
import { defaultAIService } from '@/lib/ai/service';
import { buildLearningContextSummary } from '@/lib/ai/retrieval';

export async function evaluateSubmission(
  code: string,
  exercise: Exercise,
  context: EvaluationContext
): Promise<EvaluationResult> {
  if (context.userId) {
    const summary = await buildLearningContextSummary(context.userId, exercise.id).catch(() => null);
    return defaultAIService.evaluateCode(code, exercise, {
      ...context,
      contextSummary: summary ?? undefined,
    });
  }

  return defaultAIService.evaluateCode(code, exercise, context);
}

export async function generateHint(exercise: Exercise, previousHints: string[] | null) {
  return defaultAIService.generateHint(exercise, previousHints);
}
