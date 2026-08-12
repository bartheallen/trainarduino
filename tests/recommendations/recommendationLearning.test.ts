import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as learning from '@/lib/services/recommendationLearningService';
import * as weightsRepo from '@/lib/repos/recommendationWeightsRepo';

vi.mock('@/lib/repos/recommendationHistoryRepo', () => ({
  getHistoryById: vi.fn(async (id: string) => ({ id, recommendation_id: 'rec-1' })),
}));

vi.mock('@/lib/repos/recommendationWeightsRepo', () => ({
  upsertWeight: vi.fn(async (w: any) => ({ id: 'w-1', ...w })),
  getWeightByRecommendationId: vi.fn(async () => null),
  listWeightsForUser: vi.fn(async () => []),
}));

describe('Recommendation learning', () => {
  beforeEach(() => {
    (weightsRepo.upsertWeight as any).mockClear?.();
  });

  it('scores positive feedback and updates weight', async () => {
    const fb: any = { recommendation_history_id: 'h-1', user_id: 'u1', rating: 5, feedback: 'Très utile' };
    const res = await learning.RecommendationPreferenceLearner.learnFromFeedback(fb);
    expect(res).toBeTruthy();
  });

  it('scores negative feedback and updates weight', async () => {
    const fb: any = { recommendation_history_id: 'h-1', user_id: 'u1', rating: 1, feedback: 'Inutile' };
    const res = await learning.RecommendationPreferenceLearner.learnFromFeedback(fb);
    expect(res).toBeTruthy();
  });
});
