import { ScoreCalculator, ScoreContext, ScoreResult } from '../interfaces';

export const KnowledgeDecayCalculator: ScoreCalculator = {
  key: 'knowledgeDecay',
  calculate(context: ScoreContext): ScoreResult {
    // Placeholder: compute decay score based on learningProfile forgetting_rate
    const rate = context.learningProfile?.forgetting_rate ?? 0;
    const score = Math.min(50, Math.round(rate * 100));
    return { key: 'knowledgeDecay', score, reason: `Forgetting rate ${rate}` };
  },
};
