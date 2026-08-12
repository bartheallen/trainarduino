import type { EvaluationResult } from '@/lib/ai/types';

export function parseAIResponse(rawText: string): EvaluationResult {
  try {
    const parsed = JSON.parse(rawText);
    return {
      score: Number(parsed.score ?? 0),
      passed: Boolean(parsed.passed),
      feedback: String(parsed.feedback ?? ''),
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      commonMistakes: Array.isArray(parsed.commonMistakes) ? parsed.commonMistakes : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      providerName: 'unknown',
      estimatedCostCents: 0,
      modelName: String(parsed.modelName ?? 'unknown'),
      rawValidation: parsed,
    };
  } catch (error) {
    return {
      score: 0,
      passed: false,
      feedback: rawText,
      suggestions: [],
      commonMistakes: [],
      nextSteps: [],
      providerName: 'unknown',
      estimatedCostCents: 0,
      modelName: 'unknown',
      rawValidation: { error: String(error) },
    };
  }
}
