import type { Exercise } from '@/lib/types';
import type { HintResult, EvaluationResult } from '@/lib/ai/types';
import { generateHint } from '@/lib/ai/evaluation';

export async function createFeedbackFromEvaluation(evaluation: EvaluationResult) {
  return {
    summary: evaluation.feedback,
    suggestions: evaluation.suggestions,
    nextSteps: evaluation.nextSteps,
    commonMistakes: evaluation.commonMistakes,
    score: evaluation.score,
    passed: evaluation.passed,
  };
}

export async function requestHint(exercise: Exercise, previousHints: string[] | null = null): Promise<HintResult> {
  return generateHint(exercise, previousHints);
}
