import { describe, it, expect } from 'vitest';
import type { PersonalizationRequest } from '@/lib/personalization/types';
import { buildPersonalizationPlan } from '@/lib/services/personalizationEngine';

describe('PersonalizationEngine', () => {
  it('builds an adaptive plan with review and challenge content', async () => {
    const request: PersonalizationRequest = {
      userId: 'user-1',
      targetConcept: 'led-basics',
      availableMinutes: 45,
      difficultyLevel: 'normal',
      learningStyle: 'visual',
      preferReview: true,
      includeProjects: true,
    };

    const plan = await buildPersonalizationPlan(request);

    expect(plan).toBeDefined();
    expect(plan.content.length).toBeGreaterThan(0);
    expect(plan.content.some((item) => item.type === 'review')).toBe(true);
    expect(plan.content.some((item) => item.type === 'challenge')).toBe(true);
    expect(plan.estimatedMinutes).toBeGreaterThan(0);
  });

  it('keeps the plan within the available minutes budget', async () => {
    const request: PersonalizationRequest = {
      userId: 'user-2',
      targetConcept: 'timers',
      availableMinutes: 25,
      difficultyLevel: 'easy',
      learningStyle: 'visual',
      preferReview: true,
      includeProjects: true,
    };

    const plan = await buildPersonalizationPlan(request);

    expect(plan.estimatedMinutes).toBeLessThanOrEqual(25);
    expect(plan.content.length).toBeGreaterThan(0);
  });
});
