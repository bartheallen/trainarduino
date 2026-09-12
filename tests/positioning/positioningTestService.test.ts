import { beforeEach, describe, expect, it, vi } from 'vitest';
import { savePositioningTestResultAction } from '@/lib/positioningServerActions';
import { determinePositioningLevel } from '@/lib/services/positioningTestService';
import type { Mock } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } } })) },
  })),
}));

vi.mock('@/lib/db', () => {
  const upsertPositioningTestResult = vi.fn(async (userId, palierAtteint, score, reponsesCorrectes, totalQuestions) => ({
    user_id: userId,
    palier_atteint: palierAtteint,
    score,
    reponses_correctes: reponsesCorrectes,
    total_questions: totalQuestions,
  }));

  const updateUserLevel = vi.fn(async () => null);

  return {
    upsertPositioningTestResult,
    updateUserLevel,
  };
});

const { upsertPositioningTestResult: mockUpsert, updateUserLevel: mockUpdateLevel } =
  await import('@/lib/db');

describe('positioning test service', () => {
  describe('determinePositioningLevel', () => {
    it('returns advanced at 80%', () => {
      const result = determinePositioningLevel(8, 10);
      expect(result.levelName).toBe('advanced');
      expect(result.palierAtteint).toBe(3);
      expect(result.score).toBe(80);
    });

    it('returns intermediate at 60%', () => {
      const result = determinePositioningLevel(6, 10);
      expect(result.levelName).toBe('intermediate');
      expect(result.palierAtteint).toBe(2);
      expect(result.score).toBe(60);
    });

    it('returns beginner below 60%', () => {
      const result = determinePositioningLevel(2, 10);
      expect(result.levelName).toBe('beginner');
      expect(result.palierAtteint).toBe(1);
      expect(result.score).toBe(20);
    });
  });

  describe('savePositioningTestResultAction', () => {
    beforeEach(() => {
      (mockUpsert as Mock).mockClear();
      (mockUpdateLevel as Mock).mockClear();
    });

    it('saves a 100% score as level 4 and persists percentage', async () => {
      const result = await savePositioningTestResultAction(10, 10);

      expect(result?.palier_atteint).toBe(4);
      expect(result?.score).toBe(100);
      expect(result?.reponses_correctes).toBe(10);
      expect(mockUpsert).toHaveBeenLastCalledWith('user-1', 4, 100, 10, 10);
      expect(mockUpdateLevel).toHaveBeenCalledWith('user-1', 4);
    });

    it('saves a 70% score as level 3', async () => {
      const result = await savePositioningTestResultAction(7, 10);

      expect(result?.palier_atteint).toBe(3);
      expect(result?.score).toBe(70);
      expect(result?.reponses_correctes).toBe(7);
    });

    it('saves a 50% score as level 2', async () => {
      const result = await savePositioningTestResultAction(5, 10);

      expect(result?.palier_atteint).toBe(2);
      expect(result?.score).toBe(50);
      expect(result?.reponses_correctes).toBe(5);
    });
  });
});
