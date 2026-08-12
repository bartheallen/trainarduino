import type { EventEnvelope } from '@/lib/events/types';
import { defaultSubscriber } from '@/lib/events/subscriber';
import * as learning from '@/lib/services/recommendationLearningService';
import * as historyRepo from '@/lib/repos/recommendationHistoryRepo';

async function handleFeedbackReceived(event: EventEnvelope<any>) {
  const payload = event.payload || {};
  const feedback = payload as any;
  // pass to learner
  try {
    await learning.RecommendationPreferenceLearner.learnFromFeedback(feedback);
  } catch (err) {
    console.error('learning subscriber error', err);
  }
}

// subscribe to feedback events
defaultSubscriber.subscribe('RecommendationFeedbackReceived', handleFeedbackReceived);

// utility: when weights updated, refresh recommendations for user
async function handleWeightsUpdated(event: EventEnvelope<any>) {
  const userId = event.userId;
  if (!userId) return;
  // notify recommendation system to refresh
  try {
    const h = await historyRepo.listDecisionHistory(userId).catch(() => []);
    await learning.RecommendationHistoryAggregator.aggregateForRecommendation?.(h[0]?.recommendation_id ?? '');
  } catch (err) {
    console.error('weights update handler error', err);
  }
}

defaultSubscriber.subscribe('RecommendationWeightsUpdated', handleWeightsUpdated);
