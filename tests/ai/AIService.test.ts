import { describe, it, expect } from 'vitest';
import { AIService } from '@/lib/ai/service';
import type { AIProvider, ChatResponse, EvaluationResult, HintResult } from '@/lib/ai/types';
import type { Exercise } from '@/lib/types';

const sampleExercise: Exercise = {
  id: 1,
  module_id: 1,
  titre: 'Sample exercise',
  enonce: 'Write a small Arduino sketch.',
  critere_correction: null,
  exemple_solution: null,
  xp_recompense: 10,
  difficulte: 'easy',
  wokwi_project_url: null,
  ordre: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function makeProvider(name: string, priority: number, available: boolean, cost: number): AIProvider {
  return {
    name,
    priority,
    async isAvailable() {
      return available;
    },
    async estimateCost() {
      return cost;
    },
    async evaluateCode(): Promise<EvaluationResult> {
      return {
        score: 1,
        passed: true,
        feedback: `${name} evaluated code`,
        suggestions: [],
        commonMistakes: [],
        nextSteps: [],
        providerName: name,
        estimatedCostCents: cost,
      };
    },
    async generateHint(): Promise<HintResult> {
      return {
        hint: `${name} hint`,
        reason: 'test provider',
      };
    },
    async chat(message: string): Promise<ChatResponse> {
      return {
        reply: `${name} reply: ${message}`,
      };
    },
  };
}

describe('AIService', () => {
  it('delegates evaluateCode, generateHint, and chat to the selected provider', async () => {
    const service = new AIService();
    const chosenProvider = makeProvider('chosen-provider', 99, true, 500);
    const fallbackProvider = makeProvider('fallback-provider', 1, true, 0);

    service.registerProvider(chosenProvider);
    service.registerProvider(fallbackProvider);

    const evaluation = await service.evaluateCode('code', sampleExercise, { language: 'arduino' });
    expect(evaluation.providerName).toBe('chosen-provider');

    const hint = await service.generateHint(sampleExercise, []);
    expect(hint.hint).toContain('chosen-provider');

    const chat = await service.chat('hello');
    expect(chat.reply).toContain('chosen-provider');
  });
});
