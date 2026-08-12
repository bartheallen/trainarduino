import { describe, it, expect } from 'vitest';
import { generateTopRecommendations } from '@/lib/services/recommendationEngineService';

describe('RecommendationEngine', () => {
  it('returns ranked recommendations for a user with weak concepts', async () => {
    const recommendations = await generateTopRecommendations('user-1');

    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0]).toHaveProperty('candidate');
    expect(recommendations[0]).toHaveProperty('score');
  });
});
