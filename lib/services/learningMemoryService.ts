import type { Exercise, Submission } from '@/lib/types';
import type { EvaluationResult } from '@/lib/ai/types';
import * as memoryRepo from '@/lib/repos/learningMemoryRepo';
import * as conversationRepo from '@/lib/repos/aiConversationRepo';
import * as learningProfileRepo from '@/lib/repos/learningProfileRepo';
import * as memoryEngine from '@/lib/services/memoryEngineService';
import * as db from '@/lib/db';
import type { LearningMemoryRecordRow } from '@/lib/memory/types';

export async function recordLearningMemory(record: Omit<LearningMemoryRecordRow, 'id' | 'created_at'>) {
  return memoryRepo.createMemoryRecord(record);
}

export async function recordConversationMessage(
  userId: string,
  role: 'user' | 'assistant' | 'system',
  message: string,
  topic?: string,
  metadata: Record<string, any> = {}
) {
  return conversationRepo.recordConversationMessage(userId, role, message, topic, metadata);
}

export async function recordAIEvaluationMemory(
  userId: string,
  evaluation: EvaluationResult,
  submission?: Submission | null,
  exercise?: Exercise | null,
  context?: { submissionId?: number; exerciseId?: number }
) {
  const tags = ['ai_correction', evaluation.passed ? 'passed' : 'failed'];
  const exerciseId = exercise?.id ?? context?.exerciseId;
  const submissionId = submission?.id ?? context?.submissionId;

  if (exerciseId) {
    tags.push(`exercise_${exerciseId}`);
  }

  const baseContent = [
    `Feedback: ${evaluation.feedback}`,
    `Suggestions: ${evaluation.suggestions.join(' | ')}`,
    `Next steps: ${evaluation.nextSteps.join(' | ')}`,
    `Common mistakes: ${evaluation.commonMistakes.join(' | ')}`,
  ].join('\n');

  await recordLearningMemory({
    user_id: userId,
    exercise_id: exerciseId ?? null,
    submission_id: submissionId ?? null,
    record_type: 'ai_correction',
    content: baseContent,
    tags,
    metadata: {
      score: evaluation.score,
      passed: evaluation.passed,
      providerName: evaluation.providerName,
      modelName: evaluation.modelName,
      commonMistakes: evaluation.commonMistakes,
      nextSteps: evaluation.nextSteps,
      suggestions: evaluation.suggestions,
      exerciseId,
      submissionId,
    },
  });

  for (const mistake of evaluation.commonMistakes || []) {
    await recordLearningMemory({
      user_id: userId,
      exercise_id: exerciseId ?? null,
      submission_id: submissionId ?? null,
      record_type: 'common_mistake',
      content: mistake,
      tags: ['common_mistake', ...(exerciseId ? [`exercise_${exerciseId}`] : [])],
      metadata: {
        exerciseId,
        submissionId,
      },
    }).catch(() => null);
  }
}

export async function recordExerciseValidationMemory(userId: string, payload: any) {
  const exerciseId = Number(payload.exerciseId ?? 0) || null;
  const status = payload.correct ? 'correct' : 'incorrect';
  const content = [
    `Exercise ${exerciseId} validation: ${status}`,
    `Score: ${payload.score ?? 'unknown'}`,
    `XP: ${payload.xp ?? 0}`,
    `Quality: ${payload.quality ?? 'unknown'}`,
    `Concepts: ${Array.isArray(payload.concepts) ? payload.concepts.join(', ') : 'n/a'}`,
  ].join('\n');

  await recordLearningMemory({
    user_id: userId,
    exercise_id: exerciseId,
    submission_id: null,
    record_type: 'exercise_validation',
    content,
    tags: ['exercise_validation', status],
    metadata: payload,
  }).catch(() => null);
}

function truncate(value: string, limit: number) {
  return value.length <= limit ? value : `${value.slice(0, limit - 3)}...`;
}

export async function getLearningContextSummary(userId: string, exerciseId?: number) {
  const [learningProfile, projection, memoryRecords, recentMistakes, conversationHistory, submissions] = await Promise.all([
    learningProfileRepo.getProfileByUserId(userId).catch(() => null),
    memoryEngine.getDashboardProjection(userId).catch(() => null),
    memoryRepo.listMemoryRecordsForUser(userId, 20).catch(() => []),
    memoryRepo.listRecentMistakes(userId, 10).catch(() => []),
    conversationRepo.listConversationHistory(userId, 20).catch(() => []),
    db.getUserSubmissions(userId).catch(() => []),
  ]);

  const exerciseHistory = submissions
    .slice(0, 10)
    .map((submission) => `#${submission.exercise_id} ${submission.statut} score=${submission.note ?? 'n/a'} xp=${submission.xp_gagne}`)
    .join('; ');

  const recentMistakesList = recentMistakes
    .slice(0, 5)
    .map((item) => `- ${truncate(item.content, 120)}`)
    .join('\n');

  const memorySummary = memoryRecords
    .slice(0, 5)
    .map((item) => `- [${item.record_type}] ${truncate(item.content, 120)}`)
    .join('\n');

  const conversationSummary = conversationHistory
    .slice(-5)
    .map((item) => `(${item.role}) ${truncate(item.message, 100)}`)
    .join('\n');

  const weakConcepts = (projection?.weak_concepts || []).slice(0, 5).join(', ');
  const strongConcepts = (projection?.strong_concepts || []).slice(0, 5).join(', ');
  const learningDna = projection?.learning_dna || {};

  const profileSummary = learningProfile
    ? [
        `learning_velocity=${learningProfile.learning_velocity}`,
        `forgetting_rate=${learningProfile.forgetting_rate}`,
        `confidence=${learningProfile.confidence_score}`,
        `preferred_exercise_type=${learningProfile.preferred_exercise_type}`,
        `preferred_project_difficulty=${learningProfile.preferred_project_difficulty}`,
      ].join(', ')
    : 'No learning profile available.';

  const contextParts = [
    `User learning profile: ${profileSummary}`,
    `Weak concepts: ${weakConcepts || 'none'}`,
    `Strong concepts: ${strongConcepts || 'none'}`,
    `Exercise history: ${exerciseHistory || 'no recent submissions'}`,
    `Recent mistakes:\n${recentMistakesList || 'none recorded'}`,
    `Recent memory records:\n${memorySummary || 'none recorded'}`,
    `Recent conversation snippets:\n${conversationSummary || 'none recorded'}`,
    `Learning DNA: ${JSON.stringify(learningDna)}`,
  ];

  if (exerciseId) {
    contextParts.unshift(`Target exercise: ${exerciseId}`);
  }

  return contextParts.join('\n\n');
}

export async function getMemoryRecordsForUser(userId: string) {
  return memoryRepo.listMemoryRecordsForUser(userId, 100);
}
