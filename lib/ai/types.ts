import type { Exercise } from '@/lib/types';

export interface EvaluationContext {
  userId?: string | null;
  language: 'cpp' | 'arduino';
  timeSpentSeconds?: number;
  previousAttempts?: number;
  submissionId?: number;
  contextSummary?: string;
  conversationHistory?: string[];
}

import type { PedagogicalReport } from '@/lib/pedagogy/PedagogicalReport';

export interface EvaluationResult {
  score: number; // 0.0 - 1.0
  passed: boolean;
  feedback: string;
  suggestions: string[];
  commonMistakes: string[];
  nextSteps: string[];
  providerName: string;
  estimatedCostCents: number;
  modelName?: string;
  rawValidation?: any;
  pedagogicalReport?: PedagogicalReport;
}

export interface HintResult {
  hint: string;
  reason: string;
}

export interface ChatResponse {
  reply: string;
  details?: string;
}

export interface AIProvider {
  name: string;
  priority: number;
  isAvailable(): Promise<boolean>;
  estimateCost(): Promise<number>;
  evaluateCode(code: string, exercise: Exercise, context: EvaluationContext): Promise<EvaluationResult>;
  generateHint(exercise: Exercise, previousHints: string[] | null): Promise<HintResult>;
  chat(message: string, context?: { userId?: string | null; topic?: string }): Promise<ChatResponse>;
}
