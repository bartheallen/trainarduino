import * as db from '@/lib/db';
import * as memoryEngine from '@/lib/services/memoryEngineService';
import * as learningProfileRepo from '@/lib/repos/learningProfileRepo';
import * as learningDnaRepo from '@/lib/repos/learningDnaRepo';
// student learning profile type intentionally not referenced in this module
// import kept for clarity removed to avoid unused import errors
import type { LearningDNA } from '@/lib/memory/types';

export type AdaptiveLearningPace = 'fast' | 'steady' | 'deliberate';
export type AdaptiveFocus = 'review' | 'practice' | 'challenge';
export type AdaptiveQuizAffinity = 'review' | 'assessment' | 'challenge';

export interface AdaptiveLearningTraits {
  preferredExerciseType: string;
  learningPace: AdaptiveLearningPace;
  focus: AdaptiveFocus;
  challengeReadiness: number;
  persistence: number;
  quizAffinity: AdaptiveQuizAffinity;
  confidence: number;
}

export interface AdaptiveLearningProfile {
  userId: string;
  level: number;
  xpTotal: number;
  currentModuleId: number | null;
  currentModuleProgress: number;
  completedModules: number;
  totalModules: number;
  moduleCompletionPercent: number;
  masteryPercent: number;
  knowledgeHealth: number;
  weakConcepts: string[];
  strongConcepts: string[];
  recentSuccessRate: number;
  averageXpPerSubmission: number;
  preferredExerciseType: string;
  preferredProjectDifficulty: number;
  learningVelocity: number;
  confidenceScore: number;
  learningDNA: Record<string, any>;
  traits: AdaptiveLearningTraits;
}

export interface AdaptiveRecommendation {
  userId: string;
  difficultyAdjustment: -1 | 0 | 1;
  recommendedAction: 'review' | 'practice' | 'challenge' | 'project' | 'unlock' | 'quiz';
  recommendedContentType: 'exercise' | 'quiz' | 'project' | 'review';
  targetDifficulty: number;
  reviewConcepts: string[];
  challengeConcepts: string[];
  suggestedModuleId?: number;
  suggestedModuleTitle?: string;
  explanation: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildLearningPace(submissions: number, successRate: number): AdaptiveLearningPace {
  if (successRate >= 0.8 && submissions >= 8) return 'fast';
  if (successRate >= 0.6 && submissions >= 4) return 'steady';
  return 'deliberate';
}

function buildAdaptiveFocus(weakConcepts: number, successRate: number): AdaptiveFocus {
  if (weakConcepts >= 3 || successRate < 0.65) return 'review';
  if (successRate >= 0.85) return 'challenge';
  return 'practice';
}

function buildQuizAffinity(successRate: number, confidence: number): AdaptiveQuizAffinity {
  if (confidence >= 80 && successRate >= 0.75) return 'challenge';
  if (successRate >= 0.6) return 'assessment';
  return 'review';
}

function normalizeSuccessRate(value: number) {
  return clamp(Math.round(value * 100), 0, 100) / 100;
}

// mapDifficultyToNumber removed (unused helper)

export async function buildLearningDNA(userId: string): Promise<LearningDNA> {
  const profile = await learningProfileRepo.getProfileByUserId(userId).catch(() => null);
  const projection = await memoryEngine.getDashboardProjection(userId).catch(() => null);
  const submissions = await db.getUserSubmissions(userId).catch(() => []);
  const approvedCount = submissions.filter((item) => item.statut === 'approved').length;
  const submissionCount = submissions.length || 1;
  const successRate = normalizeSuccessRate(approvedCount / submissionCount);
  const confidence = profile?.confidence_score ?? Math.round(successRate * 100);
  // reviewBias omitted (previously unused) to avoid lint/typecheck warnings

  const traits = {
    preferredExerciseType: profile?.preferred_exercise_type ?? 'code',
    learningPace: buildLearningPace(submissionCount, successRate),
    focus: buildAdaptiveFocus(projection?.weak_concepts?.length ?? 0, successRate),
    challengeReadiness: Math.round(successRate * 100),
    persistence: clamp((profile?.retry_count ?? 0) / 10, 0, 1),
    quizAffinity: buildQuizAffinity(successRate, confidence),
    confidence,
  };

  return learningDnaRepo.upsertLearningDNA(userId, traits);
}

export async function refreshAdaptiveLearningProfile(userId: string): Promise<AdaptiveLearningProfile> {
  const [profile, projection, modules, submissions, progressRows] = await Promise.all([
    learningProfileRepo.getProfileByUserId(userId).catch(() => null),
    memoryEngine.getDashboardProjection(userId).catch(() => null),
    db.getModules().catch(() => []),
    db.getUserSubmissions(userId).catch(() => []),
    db.getUserProgress(userId).catch(() => []),
  ]);

  const userProfile = await db.getUserProfile(userId).catch(() => null);
  const currentModuleId = userProfile?.module_actuel_id ? Number(userProfile.module_actuel_id) : null;
  const currentModuleProgress = currentModuleId
    ? (await db.getModuleProgress(userId, currentModuleId).catch(() => null))?.score ?? 0
    : 0;

  const approvedCount = submissions.filter((item) => item.statut === 'approved').length;
  const submissionCount = submissions.length || 1;
  const recentSuccessRate = normalizeSuccessRate(approvedCount / submissionCount);
  const averageXpPerSubmission = Math.round(
    submissions.reduce((sum, item) => sum + (item.xp_gagne || 0), 0) / submissionCount
  );

  const totalModules = modules.length;
  const completedModules = progressRows.filter((row) => row.statut === 'completed').length;
  const moduleCompletionPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  const weakConcepts = Array.isArray(projection?.weak_concepts) ? projection.weak_concepts.slice(0, 5).map(String) : [];
  const strongConcepts = Array.isArray(projection?.strong_concepts) ? projection.strong_concepts.slice(0, 5).map(String) : [];

  const traits = {
    preferredExerciseType: profile?.preferred_exercise_type ?? 'code',
    learningPace: buildLearningPace(submissionCount, recentSuccessRate),
    focus: buildAdaptiveFocus(weakConcepts.length, recentSuccessRate),
    challengeReadiness: Math.round(recentSuccessRate * 100),
    persistence: clamp((profile?.retry_count ?? 0) / 10, 0, 1),
    quizAffinity: buildQuizAffinity(recentSuccessRate, profile?.confidence_score ?? Math.round(recentSuccessRate * 100)),
    confidence: profile?.confidence_score ?? Math.round(recentSuccessRate * 100),
  };

  const dna = await learningDnaRepo.upsertLearningDNA(userId, traits).catch(() => null);

  const updatedProfile = await learningProfileRepo.upsertLearningProfile(userId, {
    weak_concepts: weakConcepts,
    strong_concepts: strongConcepts,
    preferred_exercise_type: traits.preferredExerciseType,
    preferred_project_difficulty: clamp(profile?.preferred_project_difficulty ?? 3, 1, 5),
    learning_velocity: clamp(profile?.learning_velocity ?? Math.round(Math.min(10, submissionCount / 2 + recentSuccessRate * 2)), 1, 10),
    confidence_score: traits.confidence,
    retry_count: submissions.length,
    avg_solving_time_ms: profile?.avg_solving_time_ms ?? 0,
    metadata: { ...profile?.metadata, learning_dna: traits },
  }).catch(() => null);

  return {
    userId,
    level: userProfile?.niveau_actuel ?? 1,
    xpTotal: userProfile?.xp_total ?? 0,
    currentModuleId,
    currentModuleProgress,
    completedModules,
    totalModules,
    moduleCompletionPercent,
    masteryPercent: projection?.mastery_percent ?? 0,
    knowledgeHealth: projection?.knowledge_health ?? 0,
    weakConcepts,
    strongConcepts,
    recentSuccessRate,
    averageXpPerSubmission,
    preferredExerciseType: traits.preferredExerciseType,
    preferredProjectDifficulty: profile?.preferred_project_difficulty ?? 3,
    learningVelocity: updatedProfile?.learning_velocity ?? traits.learningPace === 'fast' ? 8 : traits.learningPace === 'steady' ? 5 : 3,
    confidenceScore: traits.confidence,
    learningDNA: dna?.traits ?? {},
    traits,
  };
}

export async function recommendAdaptiveActions(userId: string): Promise<AdaptiveRecommendation> {
  const profile = await refreshAdaptiveLearningProfile(userId);
  const weakCount = profile.weakConcepts.length;

  const difficultyAdjustment = profile.recentSuccessRate >= 0.85 && weakCount <= 2 ? 1 : profile.recentSuccessRate <= 0.6 || weakCount >= 3 ? -1 : 0;
  const targetDifficulty = clamp(profile.preferredProjectDifficulty + difficultyAdjustment, 1, 5);

  const shouldReview = profile.knowledgeHealth < 60 || weakCount >= 3 || profile.recentSuccessRate < 0.65;
  const shouldChallenge = profile.recentSuccessRate >= 0.85 && profile.knowledgeHealth >= 65;
  const shouldProject = profile.recentSuccessRate >= 0.75 && profile.level >= 3;

  let recommendedAction: AdaptiveRecommendation['recommendedAction'] = 'practice';
  let recommendedContentType: AdaptiveRecommendation['recommendedContentType'] = 'exercise';
  let explanation = 'Le système utilise votre progression récente et votre profil pédagogique pour ajuster la prochaine étape.';

  if (shouldReview) {
    recommendedAction = 'review';
    recommendedContentType = 'review';
    explanation = 'Vos résultats récents montrent des concepts faibles et une santé de connaissances à renforcer.';
  } else if (shouldChallenge) {
    recommendedAction = 'challenge';
    recommendedContentType = 'project';
    explanation = 'Vous êtes prêt pour un défi plus exigeant et transversal.';
  } else if (shouldProject) {
    recommendedAction = 'project';
    recommendedContentType = 'project';
    explanation = 'Votre progression est solide, un mini-projet permet de synthétiser les notions.';
  } else {
    recommendedAction = 'practice';
    recommendedContentType = 'exercise';
    explanation = 'Continuez avec des exercices ciblés pour consolider vos connaissances.';
  }

  const modules = await db.getModules().catch(() => []);
  const progressRows = await db.getUserProgress(userId).catch(() => []);
  const startedModuleIds = new Set(progressRows.map((row) => row.module_id));
  const nextModule = modules.find((module) => module.palier_test === profile.level && !startedModuleIds.has(module.id));

  return {
    userId,
    difficultyAdjustment,
    recommendedAction: nextModule && profile.currentModuleProgress >= 90 && profile.recentSuccessRate >= 0.8 ? 'unlock' : recommendedAction,
    recommendedContentType: nextModule && profile.currentModuleProgress >= 90 && profile.recentSuccessRate >= 0.8 ? 'project' : recommendedContentType,
    targetDifficulty,
    reviewConcepts: profile.weakConcepts.slice(0, 3),
    challengeConcepts: profile.strongConcepts.slice(0, 3),
    suggestedModuleId: nextModule?.id,
    suggestedModuleTitle: nextModule?.titre,
    explanation,
  };
}
