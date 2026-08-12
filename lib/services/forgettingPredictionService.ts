import * as events from '@/lib/repos/eventRepo';

// NOTE: This service designs the interface for later ML/heuristic implementations.
export async function predictForgetting(userId: string, horizonDays = 7) {
  // Placeholder: returns empty predictions for now.
  const predictions: Array<{ skillId: string; probability: number }> = [];
  await events.emitEvent(userId, 'KnowledgePredictedToDecay', { horizonDays, predictions });
  return predictions;
}
