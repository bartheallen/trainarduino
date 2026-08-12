import * as recRepo from '@/lib/repos/recommendationRepo';

export async function getRecommendationsForUser(userId: string) {
  return recRepo.listRecommendationsForUser(userId).catch(() => []);
}

export async function storeRecommendation(userId: string, type: string, payload: any, score = 0) {
  return recRepo.createRecommendation(userId, type, payload, score);
}
