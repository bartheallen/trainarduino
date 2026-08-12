import type { EventEnvelope } from '@/lib/events/types';
import { defaultPublisher } from '@/lib/events/publisher';
import { defaultSubscriber } from '@/lib/events/subscriber';
import { makeEvent } from '@/lib/events/utils';
import * as db from '@/lib/db';
import * as aiRepo from '@/lib/repos/aiEvaluationRepo';
import * as learningMemoryService from '@/lib/services/learningMemoryService';
import * as memoryEngine from '@/lib/services/memoryEngineService';
import * as learningProfileService from '@/lib/services/adaptiveLearningService';
import { defaultArduinoCorrectionEngine } from '@/lib/correction/engine';
import { defaultAIService } from '@/lib/ai/service';
import { formatReportMarkdown } from '@/lib/correction/report';
import { buildPedagogicalReport } from '@/lib/pedagogy/PedagogicalEngine';
import * as recommendationEngine from '@/lib/services/recommendationEngineService';
import * as adaptiveLearningService from '@/lib/services/adaptiveLearningService';

import type { CorrectionReport } from '@/lib/correction/types';

async function evaluationResultFromReport(report: CorrectionReport) {
  const score = Math.max(0, 1 - report.summary.errors * 0.25 - report.summary.warnings * 0.05);
  const passed = report.summary.errors === 0;
  const suggestions = report.issues.map((i) => i.correction || i.message).slice(0, 5);
  const commonMistakes = report.issues.map((i) => i.message).slice(0, 5);
  const nextSteps = passed ? ['Testez sur matériel réel', 'Affinez et optimisez votre code'] : ['Corrigez les erreurs signalées puis réessayez'];

  return {
    score: Number(score.toFixed(2)),
    passed,
    feedback: formatReportMarkdown(report),
    suggestions,
    commonMistakes,
    nextSteps,
    providerName: 'correction-engine',
    estimatedCostCents: 0,
    modelName: report.engineVersion ?? 'correction-engine-v0.1',
  };
}

async function handleExerciseSubmitted(event: EventEnvelope<any>) {
  const userId = event.userId;
  const payload = event.payload ?? {};
  if (!userId || !payload.exerciseId) return;

  const submission = await db.getUserSubmissionForExercise(userId, Number(payload.exerciseId)).catch(() => null);
  if (!submission || !submission.code_soumis) return;

  const exercise = await db.getExercise(Number(payload.exerciseId)).catch(() => null);
  if (!exercise) return;

  const evaluation = await defaultAIService
    .evaluateCode(submission.code_soumis, exercise, {
      userId,
      language: 'arduino',
      submissionId: submission.id,
    })
    .catch(async () => {
      // fallback: run local correction engine directly
      const report = await defaultArduinoCorrectionEngine.analyze(submission.code_soumis, {
        userId,
        exerciseId: Number(payload.exerciseId) || null,
        submissionId: submission.id,
        language: 'arduino',
        memory: null,
      });
      return evaluationResultFromReport(report);
    });

  const report = (evaluation as any).rawValidation ?? null;

  await aiRepo.createAIEvaluation(
    submission.id,
    evaluation.modelName ?? 'correction-engine',
    '',
    evaluation,
    evaluation.score,
    evaluation.suggestions,
    0,
    0
  ).catch(() => null);

  await learningMemoryService.recordAIEvaluationMemory(userId, evaluation, submission, exercise).catch(() => null);

  // Persist strong issues in learning memory (if available from rawValidation)
  if (report && Array.isArray(report.issues)) {
    for (const issue of report.issues.filter((i: any) => i.severity === 'error' || i.severity === 'critical')) {
    await learningMemoryService.recordLearningMemory({
      user_id: userId,
      exercise_id: exercise.id,
      submission_id: submission.id,
      record_type: 'correction_error',
      content: `${issue.category}: ${issue.message}`,
      tags: ['ai_correction', 'correction_error', issue.category],
      metadata: {
        issue,
        source: 'correction_engine',
      },
    }).catch(() => null);
  }
  }

  await db.updateSubmissionStatus(submission.id, submission.statut, evaluation.feedback, submission.xp_gagne, evaluation.score).catch(() => null);

  // Update derived learning models
  await memoryEngine.getDashboardProjection(userId).catch(() => null);
  await learningProfileService.refreshAdaptivePreferences(userId).catch(() => null);

  // Build or persist pedagogical report and trigger adaptive/recommendation flows
  try {
    let pedagogical = (evaluation as any).pedagogicalReport ?? null;
    if (!pedagogical && report) {
      pedagogical = await buildPedagogicalReport({ correction: report, context: { userId, exerciseId: Number(payload.exerciseId) || null, submissionId: submission.id } });
    }

    if (pedagogical) {
      await learningMemoryService.recordLearningMemory({
        user_id: userId,
        exercise_id: exercise.id,
        submission_id: submission.id,
        record_type: 'pedagogical_report',
        content: JSON.stringify({ overallScore: pedagogical.overallScore, weakConcepts: pedagogical.weakConcepts }),
        tags: ['pedagogy', 'report'],
        metadata: { pedagogical },
      }).catch(() => null);

      await recommendationEngine.generateTopRecommendations(userId).catch(() => null);

      await adaptiveLearningService.upsertLearningProfile(userId, {
        preferred_project_difficulty: pedagogical.difficulty,
        learning_velocity: pedagogical.confidence ?? undefined,
        weak_concepts: pedagogical.weakConcepts,
        strong_concepts: pedagogical.strongConcepts,
      }).catch(() => null);

      await defaultPublisher.publish(
        makeEvent({
          name: 'PedagogicalReportCreated',
          version: 1,
          source: 'pedagogy',
          userId,
          correlationId: event.correlationId,
          causationId: event.id,
          payload: { submissionId: submission.id, exerciseId: payload.exerciseId, pedagogical, generatedAt: new Date().toISOString() },
        })
      ).catch(() => null);
    }
  } catch (e) {
    // non-fatal
  }

  await defaultPublisher.publish(
    makeEvent({
      name: 'KnowledgeUpdated',
      version: 1,
      source: 'learning',
      userId,
      correlationId: event.correlationId,
      causationId: event.id,
      payload: { submissionId: submission.id, exerciseId: payload.exerciseId, report, generatedAt: new Date().toISOString() },
    })
  ).catch(() => null);

  await defaultPublisher.publish(
    makeEvent({
      name: 'RecommendationsUpdated',
      version: 1,
      source: 'recommendation',
      userId,
      correlationId: event.correlationId,
      causationId: event.id,
      payload: { userId, generatedAt: new Date().toISOString() },
    })
  ).catch(() => null);

  await defaultPublisher.publish(
    makeEvent({
      name: 'ReviewScheduled',
      version: 1,
      source: 'review',
      userId,
      correlationId: event.correlationId,
      causationId: event.id,
      payload: { userId, exerciseId: payload.exerciseId, urgency: report.summary.errors > 0 ? 'high' : 'low', generatedAt: new Date().toISOString() },
    })
  ).catch(() => null);
}

defaultSubscriber.subscribe('ExerciseSubmitted', handleExerciseSubmitted);
