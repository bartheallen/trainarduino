import * as learningMemoryService from '@/lib/services/learningMemoryService';

export async function buildLearningContextSummary(userId: string, exerciseId?: number) {
  return learningMemoryService.getLearningContextSummary(userId, exerciseId);
}
