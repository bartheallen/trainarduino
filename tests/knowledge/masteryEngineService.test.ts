import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as stateRepo from '@/lib/repos/conceptStateRepo';
import * as masteryRepo from '@/lib/repos/masteryRepo';
import * as memoryEngine from '@/lib/services/memoryEngineService';
import * as learningMemoryService from '@/lib/services/learningMemoryService';
import * as forgettingPredictionService from '@/lib/services/forgettingPredictionService';
import * as adaptiveLearningService from '@/lib/services/adaptiveLearningService';
import {
  getConceptMasteryProfile,
  computeForgettingRisk,
  updateMasteryForConcept,
  getMasterySummary,
} from '@/lib/services/masteryEngineService';

vi.mock('@/lib/repos/conceptStateRepo');
vi.mock('@/lib/repos/masteryRepo');
vi.mock('@/lib/services/memoryEngineService');
vi.mock('@/lib/services/learningMemoryService');
vi.mock('@/lib/services/forgettingPredictionService');
vi.mock('@/lib/services/adaptiveLearningService');

describe('MasteryEngineService', () => {
  const userId = 'u1';
  const conceptId = 'c1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('computes forgetting risk within bounds', () => {
    const risk = computeForgettingRisk({
      id: 's1',
      user_id: userId,
      concept_id: conceptId,
      state: 'PRACTICING',
      mastery_score: 70,
      retention_score: 0.7,
      review_urgency: 40,
      predicted_forget_date: new Date(Date.now() + 1_000_000).toISOString(),
    });
    expect(risk).toBeGreaterThanOrEqual(0);
    expect(risk).toBeLessThanOrEqual(100);
  });

  it('returns a mastery profile if state exists', async () => {
    (stateRepo.getConceptState as any).mockResolvedValue({
      id: 's1',
      user_id: userId,
      concept_id: conceptId,
      state: 'PRACTICING',
      mastery_score: 70,
      retention_score: 0.7,
      review_urgency: 40,
      last_review: new Date().toISOString(),
    });
    (masteryRepo.listMasteryHistory as any).mockResolvedValue([{
      id: 'm1',
      user_id: userId,
      concept_id: conceptId,
      mastery_score: 70,
      retention_score: 0.7,
      created_at: new Date().toISOString(),
    }]);

    const profile = await getConceptMasteryProfile(userId, conceptId);
    expect(profile).not.toBeNull();
    expect(profile?.conceptId).toBe(conceptId);
    expect(profile?.historyCount).toBe(1);
  });

  it('updates mastery and records learning memory', async () => {
    (stateRepo.getConceptState as any).mockResolvedValue({
      id: 's1',
      user_id: userId,
      concept_id: conceptId,
      state: 'PRACTICING',
      mastery_score: 55,
      retention_score: 0.6,
      review_urgency: 45,
      last_review: new Date().toISOString(),
    });
    (memoryEngine.upsertConceptState as any).mockResolvedValue({
      user_id: userId,
      concept_id: conceptId,
      attempts: 3,
      successful_attempts: 2,
    });
    (memoryEngine.computeMastery as any).mockResolvedValue({ masteryScore: 60, confidenceScore: 70, stabilityScore: 80 });
    (memoryEngine.updateForgetting as any).mockResolvedValue({ retention: 0.65, predicted_forget_date: new Date().toISOString(), review_urgency: 40 });
    (forgettingPredictionService.predictForgetting as any).mockResolvedValue({});
    (adaptiveLearningService.refreshAdaptivePreferences as any).mockResolvedValue({});
    (learningMemoryService.recordLearningMemory as any).mockResolvedValue({});
    (stateRepo.getConceptState as any).mockResolvedValueOnce({
      id: 's1',
      user_id: userId,
      concept_id: conceptId,
      state: 'PRACTICING',
      mastery_score: 60,
      retention_score: 0.65,
      review_urgency: 40,
      last_review: new Date().toISOString(),
    });
    (masteryRepo.listMasteryHistory as any).mockResolvedValue([]);

    const profile = await updateMasteryForConcept(userId, conceptId, { attempts: 3, successfulAttempts: 2, correct: true });
    expect(profile).not.toBeNull();
    expect(learningMemoryService.recordLearningMemory).toHaveBeenCalled();
  });

  it('returns mastery summary for user', async () => {
    (stateRepo.listConceptStatesForUser as any).mockResolvedValue([
      {
        id: 's1',
        user_id: userId,
        concept_id: conceptId,
        state: 'PRACTICING',
        mastery_score: 60,
        retention_score: 0.65,
        review_urgency: 40,
        last_review: new Date().toISOString(),
      },
    ]);
    (masteryRepo.listMasteryHistory as any).mockResolvedValue([]);

    const summary = await getMasterySummary(userId);
    expect(summary).toHaveLength(1);
    expect(summary[0].conceptId).toBe(conceptId);
  });
});
