import * as mem from '@/lib/services/memoryEngineService';
import * as stateRepo from '@/lib/repos/conceptStateRepo';

export async function runDailyUpdateForUser(userId: string) {
  // 1. Apply forgetting to all concepts
  const states = await stateRepo.listConceptStatesForUser(userId);
  for (const s of states) {
    await mem.updateForgetting(userId, s.concept_id);
  }

  // 2. Recompute mastery for all concepts
  for (const s of states) {
    await mem.computeMastery(userId, s.concept_id);
  }

  // 3. Refresh dashboard projection
  await mem.getDashboardProjection(userId);

  // 4. (No direct recommendation engine call here) return update summary
  return { updated: states.length };
}
