
import * as missionRepo from '@/lib/repos/missionRepo';
import * as historyRepo from '@/lib/repos/recommendationHistoryRepo';
import * as stateRepo from '@/lib/repos/conceptStateRepo';

// NOTE: Recommendation engine no longer calls memoryEngineService directly.
// It computes overlap by reading the concept state read-model (allowed by DDD rules).
export async function generateTopRecommendations(userId: string | null, _candidates: any[] = []) {
  if (!userId) return [];

  // Read priority concepts from the concept state read model
  const states = await stateRepo.listConceptStatesForUser(userId).catch(() => []);
  const conceptsOrdered = (states || [])
    .sort((a, b) => (b.review_urgency || 0) - (a.review_urgency || 0) || (a.mastery_score || 0) - (b.mastery_score || 0))
    .map((s) => s.concept_id);

  // Fetch missions and score by overlap with priority concepts
  const missions = await missionRepo.listMissions().catch(() => []);
  const scored: Array<{ candidate: any; score: number; rationale: any }> = [];

  const conceptSet = new Set(conceptsOrdered.slice(0, 50));
  for (const m of missions) {
    const missionConcepts: string[] = Array.isArray(m.concepts) ? m.concepts : [];
    const overlap = missionConcepts.filter((c) => conceptSet.has(c)).length;
    if (overlap === 0) continue;
    const difficulty = typeof m.difficulty === 'number' ? m.difficulty : 1;
    const score = overlap * 10 + difficulty * 2;
    const rationale = [{ key: 'concept_overlap', score: overlap * 10, reason: `${overlap} matching concepts` }];
    scored.push({ candidate: { id: m.id, type: 'mission', payload: m }, score, rationale });
  }

  scored.sort((a, b) => b.score - a.score);

  // persist top decisions (decision history)
  for (const r of scored.slice(0, 10)) {
    await historyRepo.recordRecommendation({ user_id: userId, recommendation_id: r.candidate.id, type: r.candidate.type, payload: r.candidate.payload, score: r.score, rationale: r.rationale }).catch(() => null);
  }

  return scored.slice(0, 5).map((s) => ({ candidate: s.candidate, score: s.score, rationale: s.rationale }));
}

export async function explainRecommendation(_decisionId: string) {
  return null;
}
