import type { Exercise } from '@/lib/types';
import { AIProvider, EvaluationResult, EvaluationContext, ChatResponse, HintResult } from '@/lib/ai/types';
import { StubAIProvider } from '@/lib/ai/providers';
import { CorrectionAIProvider } from '@/lib/ai/providers/correctionProvider';

export class AIService {
  private providers: Map<string, AIProvider> = new Map();
  private defaultProviderName = 'stub';

  constructor() {
    this.registerProvider(new StubAIProvider());
    // register local correction engine provider (lightweight, deterministic)
    try {
      this.registerProvider(new CorrectionAIProvider());
    } catch (err) {
      // non-fatal: if provider fails to init, continue with available providers
      // eslint-disable-next-line no-console
      console.warn('Failed to register CorrectionAIProvider', err);
    }
  }

  registerProvider(provider: AIProvider) {
    this.providers.set(provider.name, provider);
  }

  getProviders() {
    return Array.from(this.providers.keys());
  }

  async selectBestProvider(): Promise<AIProvider> {
    const available = [] as Array<{ provider: AIProvider; cost: number }>;
    for (const provider of this.providers.values()) {
      if (await provider.isAvailable()) {
        available.push({ provider, cost: await provider.estimateCost() });
      }
    }
    if (available.length === 0) {
      const fallback = this.providers.get(this.defaultProviderName);
      if (!fallback) throw new Error('No AI provider available');
      return fallback;
    }

    available.sort((a, b) => {
      const priorityDiff = b.provider.priority - a.provider.priority;
      if (priorityDiff !== 0) return priorityDiff;
      return a.cost - b.cost;
    });
    return available[0].provider;
  }

  async evaluateCode(code: string, exercise: Exercise, context: EvaluationContext): Promise<EvaluationResult> {
    const provider = await this.selectBestProvider();
    return provider.evaluateCode(code, exercise, context);
  }

  async generateHint(exercise: Exercise, previousHints: string[] | null): Promise<HintResult> {
    const provider = await this.selectBestProvider();
    return provider.generateHint(exercise, previousHints);
  }

  async chat(message: string, context?: { userId?: string | null; topic?: string }): Promise<ChatResponse> {
    const provider = await this.selectBestProvider();
    return provider.chat(message, context);
  }
}

export const defaultAIService = new AIService();
