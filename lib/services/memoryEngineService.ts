import * as conceptRepo from '@/lib/repos/conceptRepo';
import * as stateRepo from '@/lib/repos/conceptStateRepo';
import * as masteryRepo from '@/lib/repos/masteryRepo';
import * as dnaRepo from '@/lib/repos/learningDnaRepo';
import * as eventsRepo from '@/lib/repos/memoryEventsRepo';
import * as projectionRepo from '@/lib/repos/dashboardProjectionRepo';
import type { ConceptStateRow, LearningDNA, DashboardProjection } from '@/lib/memory/types';
import { conceptSchema, conceptStateSchema, learningDnaSchema } from '@/lib/validation/memory';

export async function registerConcept(payload: { key: string; title: string; description?: string }) {
  const parsed = conceptSchema.parse(payload);
  // ensure no duplicates by key
  const existing = await conceptRepo.getConceptByKey(parsed.key);
  if (existing) return existing;
  return await conceptRepo.createConcept({ key: parsed.key, title: parsed.title, description: parsed.description ?? undefined });
}

export async function getConcepts() {
  return await conceptRepo.listConcepts();
}

export async function upsertConceptState(state: Partial<ConceptStateRow> & { user_id: string; concept_id: string; }) {
  const parsed = conceptStateSchema.parse(state as any);
  const result = await stateRepo.upsertConceptState(parsed as any);
  // record mastery snapshot
  await masteryRepo.recordMastery({ user_id: parsed.user_id, concept_id: parsed.concept_id, mastery_score: parsed.mastery_score ?? 0, retention_score: parsed.retention_score ?? 0, source: 'upsert' });
  await eventsRepo.emitEvent({ user_id: parsed.user_id, concept_id: parsed.concept_id, event_type: 'MemoryUpdated', payload: { state: parsed.state } });
  return result;
}

export async function computeMastery(userId: string, conceptId: string) {
  // Advanced mastery algorithm
  const state = await stateRepo.getConceptState(userId, conceptId);
  const history = await masteryRepo.listMasteryHistory(userId, conceptId);

  const lastScore = state?.mastery_score ?? (history[0]?.mastery_score ?? 0);
  const attempts = state?.attempts ?? 0;
  const successes = state?.successful_attempts ?? 0;
  const successRate = attempts > 0 ? successes / attempts : (history.length ? history[0].mastery_score / 100 : 0);

  // compute recency weight (more recent interactions matter more)
  const now = Date.now();
  const recencyWeights = history.slice(0, 10).map((h, idx) => {
    const ageDays = Math.max(1, (now - new Date(h.created_at || '').getTime()) / (1000 * 60 * 60 * 24) || 1);
    return { score: h.mastery_score, weight: 1 / Math.log1p(ageDays + idx) };
  });
  const weightedSum = recencyWeights.reduce((s, r) => s + (r.score * r.weight), 0);
  const weightTotal = recencyWeights.reduce((s, r) => s + r.weight, 0) || 1;
  const historyAvg = weightTotal ? weightedSum / weightTotal : lastScore;

  // trend (stability): negative if decreasing
  const trend = (historyAvg - lastScore) / 100;

  // difficulty proxy: fewer successful attempts with low mastery suggests higher difficulty
  const difficultyFactor = attempts > 0 ? Math.max(0.5, 1 - successRate) : 0.5;

  // base score combines recent history and success rate
  let mastery = Math.round((historyAvg * 0.6) + (successRate * 100 * 0.4));

  // adjust by trend and difficulty
  mastery = Math.round(mastery * (1 - trend * 0.25) * (1 - (difficultyFactor - 0.5) * 0.2));

  // stability score: 1 - normalized stddev of recent mastery scores
  const values = history.slice(0, 10).map((h) => h.mastery_score);
  const mean = values.reduce((a, b) => a + (b || 0), 0) / (values.length || 1);
  const variance = values.reduce((a, b) => a + Math.pow((b || 0) - mean, 2), 0) / (values.length || 1);
  const stddev = Math.sqrt(variance);
  const stability = Math.max(0, 1 - Math.min(1, stddev / 50));

  // confidence: combines attempts depth and stability and recency
  const recencyFactor = state?.last_review ? Math.max(0.2, 1 - ((now - new Date(state.last_review).getTime()) / (1000 * 60 * 60 * 24 * 30))) : 0.8;
  const confidence = Math.round(Math.max(0, Math.min(100, (stability * 0.6 + Math.min(1, attempts / 5) * 0.2 + recencyFactor * 0.2) * 100)));

  mastery = Math.max(0, Math.min(100, mastery));

  // persist updates
  await stateRepo.upsertConceptState({ user_id: userId, concept_id: conceptId, mastery_score: mastery });
  await masteryRepo.recordMastery({ user_id: userId, concept_id: conceptId, mastery_score: mastery, retention_score: state?.retention_score ?? 0, source: 'computeMastery' });

  return { masteryScore: mastery, confidenceScore: confidence, stabilityScore: Math.round(stability * 100) };
}

export async function updateForgetting(userId: string, conceptId: string) {
  // Exponential forgetting model with lambda dependent on mastery and stability
  const state = await stateRepo.getConceptState(userId, conceptId);
  const mastery = state?.mastery_score ?? 0;
  const lastReview = state?.last_review ? new Date(state.last_review).getTime() : null;
  const now = Date.now();

  // stability proxy
  const recent = await masteryRepo.listMasteryHistory(userId, conceptId);
  const values = recent.slice(0, 10).map((h) => h.mastery_score);
  const mean = values.reduce((a, b) => a + (b || 0), 0) / (values.length || 1);
  const variance = values.reduce((a, b) => a + Math.pow((b || 0) - mean, 2), 0) / (values.length || 1);
  const stddev = Math.sqrt(variance);
  const stability = Math.max(0.01, 1 - Math.min(1, stddev / 50));

  // base retention is proportional to mastery
  const baseRetention = mastery / 100;

  // lambda increases when stability low (faster forgetting) and decreases with higher mastery
  const lambda = 0.02 + (1 - stability) * 0.05 + (1 - mastery / 100) * 0.02;

  const daysSince = lastReview ? Math.max(0, (now - lastReview) / (1000 * 60 * 60 * 24)) : 0;
  const retention = Math.max(0, baseRetention * Math.exp(-lambda * daysSince));

  // predicted forget date when retention drops below 0.5
  let predictedDate: string | null = null;
  if (retention > 0.001) {
    const daysToHalf = Math.log(0.5 / baseRetention) / -lambda;
    if (!Number.isNaN(daysToHalf)) {
      predictedDate = new Date(now + daysToHalf * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  const reviewUrgency = Math.round(Math.max(0, Math.min(100, (1 - retention) * 100)));

  await stateRepo.upsertConceptState({ user_id: userId, concept_id: conceptId, retention_score: retention, predicted_forget_date: predictedDate, review_urgency: reviewUrgency });

  if ((state?.retention_score ?? 1) > 0.5 && retention <= 0.5) {
    await eventsRepo.emitEvent({ user_id: userId, concept_id: conceptId, event_type: 'ConceptForgotten', payload: { retention } });
  }

  return { retention, predicted_forget_date: predictedDate, review_urgency: reviewUrgency };
}

export async function getPriorityConcepts(userId: string, limit = 20) {
  // Return concepts ordered by review urgency and low mastery, excluding locked by dependencies
  const states = await stateRepo.listConceptStatesForUser(userId);
  // filter and sort
  const scored = states.map((s) => ({ concept_id: s.concept_id, mastery: s.mastery_score ?? 0, urgency: s.review_urgency ?? 0 }));
  scored.sort((a, b) => b.urgency - a.urgency || a.mastery - b.mastery);

  const results: string[] = [];
  for (const s of scored) {
    // check prerequisites
    const prereqs = await conceptRepo.getPrerequisites(s.concept_id);
    let blocked = false;
    for (const p of prereqs) {
      const ps = await stateRepo.getConceptState(userId, p);
      if (!ps || (ps.mastery_score ?? 0) < 60) {
        blocked = true;
        break;
      }
    }
    if (!blocked) results.push(s.concept_id);
    if (results.length >= limit) break;
  }

  return results;
}

export async function updateLearningDNA(userId: string, traits: Record<string, any>) {
  const parsed = learningDnaSchema.parse({ user_id: userId, traits });
  const res = await dnaRepo.upsertLearningDNA(userId, parsed.traits || {});
  await eventsRepo.emitEvent({ user_id: userId, event_type: 'MemoryUpdated', payload: { learning_dna: res.traits } });
  return res as LearningDNA;
}

export async function getDashboardProjection(userId: string) {
  const existing = await projectionRepo.getProjection(userId);
  if (existing) return existing;

  const dna = await dnaRepo.getLearningDNA(userId);
  const states = await stateRepo.listConceptStatesForUser(userId);

  const total = states.length || 1;
  const masteryAvg = Math.round(states.reduce((s, c) => s + (c.mastery_score || 0), 0) / total);
  const weak = states.filter((c) => (c.mastery_score || 0) < 50).map((c) => c.concept_id);
  const strong = states.filter((c) => (c.mastery_score || 0) >= 80).map((c) => c.concept_id);
  const todays = states.filter((c) => c.review_urgency && c.review_urgency > 60).map((c) => ({ concept_id: c.concept_id, urgency: c.review_urgency }));
  const upcoming = states.filter((c) => c.predicted_forget_date).map((c) => ({ concept_id: c.concept_id, predicted: c.predicted_forget_date }));

  // knowledge health: weighted by mastery and retention
  const health = Math.round(states.reduce((s, c) => s + ((c.mastery_score || 0) * ((c.retention_score || 1))), 0) / total);

  const projection: Partial<DashboardProjection> & { user_id: string } = {
    user_id: userId,
    knowledge_health: health,
    mastery_percent: masteryAvg,
    weak_concepts: weak,
    strong_concepts: strong,
    todays_reviews: todays,
    upcoming_reviews: upcoming,
    heatmap: {},
    learning_dna: dna?.traits || {},
  };
  return await projectionRepo.upsertProjection(projection);
}
