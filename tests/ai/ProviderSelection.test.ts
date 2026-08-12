import { describe, it, expect } from 'vitest';
import { AIService } from '@/lib/ai/service';
import type { AIProvider } from '@/lib/ai/types';

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
    async evaluateCode() {
      return {
        score: 0,
        passed: false,
        feedback: '',
        suggestions: [],
        commonMistakes: [],
        nextSteps: [],
        providerName: name,
        estimatedCostCents: cost,
      };
    },
    async generateHint() {
      return {
        hint: '',
        reason: '',
      };
    },
    async chat() {
      return {
        reply: '',
      };
    },
  };
}

describe('ProviderSelection', () => {
  it('prefers higher priority providers over lower-cost providers', async () => {
    const service = new AIService();
    service.registerProvider(makeProvider('stub', 1, true, 1));
    service.registerProvider(makeProvider('correction-engine', 10, true, 100));
    service.registerProvider(makeProvider('custom-high-priority', 20, true, 1000));

    const selected = await service.selectBestProvider();
    expect(selected.name).toBe('custom-high-priority');
  });

  it('chooses the cheapest provider when priorities tie', async () => {
    const service = new AIService();
    service.registerProvider(makeProvider('stub', 1, true, 100));
    service.registerProvider(makeProvider('cheap-provider', 1, true, 10));
    service.registerProvider(makeProvider('correction-engine', 10, false, 100));

    const selected = await service.selectBestProvider();
    expect(selected.name).toBe('cheap-provider');
  });
});
