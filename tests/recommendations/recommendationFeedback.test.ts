import { describe, it, expect } from 'vitest';
import { recordFeedback, listDecisionHistory } from '@/lib/repos/recommendationHistoryRepo';

describe('Recommendation feedback', () => {
  it('stores feedback and lists it for the user', async () => {
    const stored = await recordFeedback({
      recommendation_history_id: '11111111-1111-1111-1111-111111111111',
      user_id: '22222222-2222-2222-2222-222222222222',
      feedback: 'Très utile',
      rating: 5,
    });

    const history = await listDecisionHistory('22222222-2222-2222-2222-222222222222');

    expect(stored).toBeTruthy();
    expect(history.some((item) => item.feedback === 'Très utile')).toBe(true);
  });
});
