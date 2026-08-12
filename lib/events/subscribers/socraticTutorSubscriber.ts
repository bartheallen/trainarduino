import type { EventEnvelope } from '@/lib/events/types';
import { defaultPublisher } from '@/lib/events/publisher';
import { defaultSubscriber } from '@/lib/events/subscriber';
import { makeEvent } from '@/lib/events/utils';
import * as learningMemoryService from '@/lib/services/learningMemoryService';
import { SocraticTutorService } from '@/lib/services/socraticTutorService';

async function handlePedagogicalReportCreated(event: EventEnvelope<any>) {
  const userId = event.userId;
  if (!userId) return;

  const pedagogical = event.payload?.pedagogical;
  if (!pedagogical) return;

  const context = await SocraticTutorService.buildSocraticTutorContext(userId, event.payload?.exerciseId);
  const firstQuestion = await SocraticTutorService.generateFirstQuestion(pedagogical, context).catch(() => 'Réfléchis à ce qui ne fonctionne pas dans ton code.');
  const plan = await SocraticTutorService.generateLearningPlan(pedagogical, context).catch(() => ({ nextLessons: [], nextExercises: [], nextProjects: [], reviewItems: [], challenges: [], confidenceAdvice: '' }));

  await learningMemoryService.recordLearningMemory({
    user_id: userId,
    exercise_id: event.payload?.exerciseId ?? null,
    submission_id: null,
    record_type: 'socratic_tutor',
    content: firstQuestion,
    tags: ['socratic', 'pedagogy'],
    metadata: { plan, firstQuestion, pedagogical },
  }).catch(() => null);

  await defaultPublisher.publish(
    makeEvent({
      name: 'RecommendationsUpdated',
      version: 1,
      source: 'socratic',
      userId,
      correlationId: event.correlationId,
      causationId: event.id,
      payload: { userId, plan, generatedAt: new Date().toISOString() },
    })
  ).catch(() => null);
}

async function handleLearningProfileUpdated(event: EventEnvelope<any>) {
  const userId = event.userId;
  if (!userId) return;
  const context = await SocraticTutorService.buildSocraticTutorContext(userId, undefined);
  await SocraticTutorService.generateLearningPlan((event.payload?.pedagogical as any) ?? { overallScore: 0, knowledgeLevel: 'beginner', difficulty: 1, mistakes: [], weakConcepts: [], strongConcepts: [], misconceptions: [], recommendedLessons: [], recommendedExercises: [], recommendedProjects: [], reviewSchedule: [], socraticQuestions: [], hints: [], learningObjectives: [] }, context).catch(() => null);
}

defaultSubscriber.subscribe('PedagogicalReportCreated', handlePedagogicalReportCreated);
defaultSubscriber.subscribe('LearningProfileUpdated', handleLearningProfileUpdated);
