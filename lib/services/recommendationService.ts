import * as repo from '@/lib/repos/recommendationRepo';
import * as events from '@/lib/repos/eventRepo';
import { recommendationSchema } from '@/lib/validation/adaptive';

export async function generateRecommendation(userId: string | null, type: string, payload: any, score = 0) {
  const parsed = recommendationSchema.parse({ user_id: userId, type, payload, score });
  const rec = await repo.createRecommendation(parsed.user_id ?? null, parsed.type, parsed.payload, parsed.score ?? 0);
  await events.emitEvent(parsed.user_id ?? null, 'RecommendationGenerated', { recommendationId: rec.id });
  return rec;
}

export async function listUserRecommendations(userId: string) {
  return repo.listRecommendationsForUser(userId);
}
