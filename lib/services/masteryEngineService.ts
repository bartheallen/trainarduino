import * as memoryEngine from '@/lib/services/memoryEngineService';
import * as learningMemoryService from '@/lib/services/learningMemoryService';
import * as forgettingPredictionService from '@/lib/services/forgettingPredictionService';
import * as adaptiveLearningService from '@/lib/services/adaptiveLearningService';
import * as stateRepo from '@/lib/repos/conceptStateRepo';
import * as masteryRepo from '@/lib/repos/masteryRepo';
import type { ConceptStateRow, MasteryHistory } from '@/lib/memory/types';

export interface MasteryProfile {
  conceptId: string;
  masteryScore: number;
  confidenceScore: number;
  stabilityScore: number;
  forgettingScore: number;
  reviewUrgency: number;
  nextReviewDate: string | null;
  learningVelocity: number;
  readinessScore: number;
  historyCount: number;
  lastReview?: string | null;
}

function computeStabilityScore(history: MasteryHistory[]): number {
  if (history.length < 2) return 100;
  const scores = history.slice(0, 10).map((item) => item.mastery_score);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
  const stddev = Math.sqrt(variance);
  return Math.round(Math.max(0, Math.min(100, 100 - stddev)));
}

function computeConfidenceScore(state: ConceptStateRow | null, history: MasteryHistory[]): number {
  const mastery = state?.mastery_score ?? (history[0]?.mastery_score ?? 0);
  const stability = computeStabilityScore(history) / 100;
  const attempts = state?.attempts ?? 0;
  const successful = state?.successful_attempts ?? 0;
  const successRate = attempts > 0 ? successful / attempts : history.length > 0 ? Math.min(1, (history[0].mastery_score ?? 0) / 100) : 0.5;
  const confidence = Math.round(Math.max(0, Math.min(100, mastery * 0.65 + stability * 20 + successRate * 15)));
  return confidence;
}

function computeLearningVelocity(history: MasteryHistory[]): number {
  const now = Date.now();
  const recent = history.filter((item) => item.created_at && now - new Date(item.created_at).getTime() <= 1000 * 60 * 60 * 24 * 30);
  const velocity = Math.min(10, Math.max(1, Math.round(recent.length / 3 + 1)));
  return velocity;
}

function computeNextReviewDate(state: ConceptStateRow | null): string | null {
  if (state?.predicted_forget_date) return state.predicted_forget_date;
  if (state?.review_urgency !== undefined) {
    const days = Math.max(1, Math.round(7 - (state.review_urgency / 20)));
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }
  return null;
}

function computeReadiness(state: ConceptStateRow | null, forgettingScore: number): number {
  const mastery = state?.mastery_score ?? 0;
  const urgency = state?.review_urgency ?? 0;
  const base = mastery * 0.6 + (100 - forgettingScore) * 0.3 + (100 - urgency) * 0.1;
  return Math.round(Math.max(0, Math.min(100, base)));
}

export async function getConceptMasteryProfile(userId: string, conceptId: string): Promise<MasteryProfile | null> {
  const [state, history] = await Promise.all([
    stateRepo.getConceptState(userId, conceptId).catch(() => null),
    masteryRepo.listMasteryHistory(userId, conceptId).catch(() => []),
  ]);

  if (!state && history.length === 0) return null;

  const forgettingScore = computeForgettingRisk(state);
  const confidenceScore = computeConfidenceScore(state, history);
  const stabilityScore = computeStabilityScore(history);
  const learningVelocity = computeLearningVelocity(history);
  const nextReviewDate = computeNextReviewDate(state);
  const readinessScore = computeReadiness(state, forgettingScore);

  return {
    conceptId,
    masteryScore: state?.mastery_score ?? (history[0]?.mastery_score ?? 0),
    confidenceScore,
    stabilityScore,
    forgettingScore,
    reviewUrgency: state?.review_urgency ?? 0,
    nextReviewDate,
    learningVelocity,
    readinessScore,
    historyCount: history.length,
    lastReview: state?.last_review ?? null,
  };
}

export function computeForgettingRisk(state: ConceptStateRow | null): number {
  if (!state) return 0;
  const retention = Math.max(0, Math.min(1, state.retention_score ?? 1));
  const urgency = state.review_urgency ?? 0;
  const dateScore = state.predicted_forget_date
    ? Math.max(0, Math.min(100, 100 - ((new Date(state.predicted_forget_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) * 5))
    : 0;
  return Math.round(Math.max(0, Math.min(100, (1 - retention) * 100 * 0.7 + urgency * 0.2 + dateScore * 0.1)));
}

export async function updateMasteryForConcept(
  userId: string,
  conceptId: string,
  interaction: { exerciseId?: number; attempts: number; successfulAttempts: number; correct: boolean }
): Promise<MasteryProfile | null> {
  const prevState = await stateRepo.getConceptState(userId, conceptId).catch(() => null);
  const attempts = Math.max(0, (prevState?.attempts ?? 0) + interaction.attempts);
  const successful_attempts = Math.max(0, (prevState?.successful_attempts ?? 0) + interaction.successfulAttempts);

  const updatedState = await memoryEngine.upsertConceptState({
    user_id: userId,
    concept_id: conceptId,
    attempts,
    successful_attempts,
    last_review: new Date().toISOString(),
  } as any).catch(() => null);

  if (!updatedState) return null;

  const masteryResult = await memoryEngine.computeMastery(userId, conceptId).catch(() => null);
  const forgettingResult = await memoryEngine.updateForgetting(userId, conceptId).catch(() => null);
  await forgettingPredictionService.predictForgetting(userId, 7).catch(() => null);
  await adaptiveLearningService.refreshAdaptivePreferences(userId).catch(() => null);

  await learningMemoryService.recordLearningMemory({
    user_id: userId,
    exercise_id: interaction.exerciseId ?? null,
    submission_id: null,
    record_type: 'mastery_interaction',
    content: `Mise à jour de la maîtrise du concept ${conceptId} : ${interaction.successfulAttempts}/${interaction.attempts} réussites`,
    tags: ['mastery', 'concept', interaction.correct ? 'success' : 'failure'],
    metadata: {
      conceptId,
      attempts,
      successful_attempts,
      correct: interaction.correct,
      masteryResult,
      forgettingResult,
    },
  }).catch(() => null);

  return getConceptMasteryProfile(userId, conceptId);
}

export async function getMasterySummary(userId: string) {
  const states = await stateRepo.listConceptStatesForUser(userId).catch(() => []);
  const histories = await Promise.all(
    states.map((state) => masteryRepo.listMasteryHistory(userId, state.concept_id).catch(() => []))
  );

  return states.map((state, index) => {
    const history = histories[index];
    const forgettingScore = computeForgettingRisk(state);
    return {
      conceptId: state.concept_id,
      masteryScore: state.mastery_score,
      confidenceScore: computeConfidenceScore(state, history),
      stabilityScore: computeStabilityScore(history),
      forgettingScore,
      reviewUrgency: state.review_urgency ?? 0,
      nextReviewDate: computeNextReviewDate(state),
      learningVelocity: computeLearningVelocity(history),
    };
  });
}
