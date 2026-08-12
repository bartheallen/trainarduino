import * as historyRepo from '@/lib/repos/recommendationHistoryRepo';
import * as weightsRepo from '@/lib/repos/recommendationWeightsRepo';
import * as events from '@/lib/repos/eventRepo';
import * as learningDnaRepo from '@/lib/repos/learningDnaRepo';
import * as learningProfileRepo from '@/lib/repos/learningProfileRepo';
import * as dashboardRepo from '@/lib/repos/dashboardRepo';
import type { RecommendationFeedback, RecommendationHistory } from '@/lib/types';

// Core learning orchestrator for recommendation feedback
export class RecommendationFeedbackAnalyzer {
  static scoreFeedback(fb: RecommendationFeedback) {
    // simple heuristic: prefer rating if present, else text sentiment crude mapping
    let base = 0;
    if (typeof fb.rating === 'number') {
      base = (fb.rating - 3) / 2; // -1..+1 where 3 is neutral
    } else if (fb.feedback && fb.feedback.length > 0) {
      const txt = fb.feedback.toLowerCase();
      if (txt.includes('utile') || txt.includes('bien') || txt.includes('parfait') || txt.includes('👍')) base = 0.8;
      else if (txt.includes('pas') || txt.includes('inutile') || txt.includes('mauvais') || txt.includes('👎')) base = -0.8;
      else base = 0;
    }
    return Math.max(-1, Math.min(1, base));
  }
}

export class RecommendationHistoryAggregator {
  static async aggregateForRecommendation(recommendationId: string) {
    // gather feedback linked to history entries for this recommendation
    const histories = await historyRepo.listDecisionHistoryByRecommendationId?.(recommendationId).catch(() => null);
    if (!histories) return { count: 0, avg: 0 };
    const feedbacks = [] as RecommendationFeedback[];
    for (const h of histories) {
      const fb = (await historyRepo.getFeedbackForHistoryId?.(h.id).catch(() => null)) as RecommendationFeedback | null;
      if (fb) feedbacks.push(fb);
    }
    if (feedbacks.length === 0) return { count: 0, avg: 0 };
    const scores = feedbacks.map(RecommendationFeedbackAnalyzer.scoreFeedback);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return { count: feedbacks.length, avg };
  }
}

export class RecommendationWeightEngine {
  static baseAdjustmentFromScore(score: number) {
    // map -1..1 to -0.5..0.5 weight adjustment
    return Math.max(-0.5, Math.min(0.5, score * 0.5));
  }

  static async updateWeightsFromFeedback(fb: RecommendationFeedback) {
    // if feedback references a history entry, attempt to get its recommendation_id
    const historyId = fb.recommendation_history_id;
    if (!historyId) return null;
    const history = (await historyRepo.getHistoryById?.(historyId).catch(() => null)) as RecommendationHistory | null;
    if (!history) return null;
    const recId = history.recommendation_id ?? String(history.id);
    const score = RecommendationFeedbackAnalyzer.scoreFeedback(fb);
    const adj = RecommendationWeightEngine.baseAdjustmentFromScore(score);

    // upsert weight for this recommendation
    const current = await weightsRepo.getWeightByRecommendationId(recId).catch(() => null);
    const newValue = Math.max(-1, Math.min(1, (current?.value ?? 0) + adj));
    await weightsRepo.upsertWeight({ recommendation_id: recId, value: newValue }).catch(() => null);

    // publish weights updated event
    await events.emitEvent(fb.user_id ?? null, 'RecommendationWeightsUpdated', { recommendationId: recId, value: newValue });
    return { recommendationId: recId, value: newValue };
  }
}

export class RecommendationRankingOptimizer {
  static applyWeightsToCandidates(candidates: Array<any>, weights: Record<string, number>) {
    return candidates.map((c) => {
      const id = c.id ?? c.recommendation_id;
      const weight = weights[id] ?? 0;
      // boost score multiplicatively
      const boosted = { ...c, _weight: weight, _adjustedScore: (c.score ?? 0) * (1 + weight) };
      return boosted;
    }).sort((a, b) => (b._adjustedScore ?? 0) - (a._adjustedScore ?? 0));
  }
}

export class RecommendationConfidenceCalculator {
  static confidenceFromHistory(historyAgg: { count: number; avg: number }) {
    // confidence grows with number of feedbacks and magnitude of avg
    return Math.tanh(historyAgg.avg) * Math.min(1, Math.log2(Math.max(1, historyAgg.count)) / 4);
  }
}

export class RecommendationPreferenceLearner {
  static async learnFromFeedback(fb: RecommendationFeedback) {
    // quick path: update per-recommendation weight
    const res = await RecommendationWeightEngine.updateWeightsFromFeedback(fb).catch(() => null);
    await events.emitEvent(fb.user_id ?? null, 'RecommendationLearningCompleted', { result: res });
    // also emit profile update trigger
    await events.emitEvent(fb.user_id ?? null, 'LearningProfileImproved', { userId: fb.user_id });

    // Synchronize to LearningDNA, StudentLearningProfile and DashboardProjection
    try {
      const score = fb.rating !== undefined && fb.rating !== null ? ((fb.rating - 3) / 2) : (fb.feedback ? RecommendationFeedbackAnalyzer.scoreFeedback(fb) : 0);
      const history = fb.recommendation_history_id ? await historyRepo.getHistoryById?.(fb.recommendation_history_id).catch(() => null) : null;
      const concept = (history as any)?.payload?.concept ?? (history as any)?.payload?.concepts?.[0] ?? null;

      // Update Learning DNA: aggregate a small running value for recommendation feedback
      try {
        const existing = await learningDnaRepo.getLearningDNA(fb.user_id!).catch(() => null);
        const currentTraits = (existing && (existing as any).traits) || {};
        const delta = (score || 0) * 0.1;
        currentTraits.recommendation_feedback_score = (currentTraits.recommendation_feedback_score || 0) + delta;
        await learningDnaRepo.upsertLearningDNA(fb.user_id!, currentTraits).catch(() => null);
      } catch {}

      // Update Student Learning Profile: adjust confidence and strong/weak concepts
      try {
        const profile = await learningProfileRepo.getProfileByUserId(fb.user_id!).catch(() => null);
        const confidenceDelta = Math.round((score || 0) * 10);
        const newConfidence = Math.max(0, Math.min(100, ((profile as any)?.confidence_score || 0) + confidenceDelta));
        const strong = new Set(((profile as any)?.strong_concepts) || []);
        const weak = new Set(((profile as any)?.weak_concepts) || []);
        if (concept) {
          if ((score || 0) > 0) {
            strong.add(concept);
            weak.delete(concept);
          } else if ((score || 0) < 0) {
            weak.add(concept);
            strong.delete(concept);
          }
        }
        await learningProfileRepo.upsertLearningProfile(fb.user_id!, {
          confidence_score: newConfidence,
          strong_concepts: Array.from(strong) as string[],
          weak_concepts: Array.from(weak) as string[],
        }).catch(() => null);
      } catch {}

      // Update dashboard projection with refreshed learning_dna snippet
      try {
        const proj = await dashboardRepo.getDashboardProjection(fb.user_id!).catch(() => null);
        const newProj = { ...(proj || {}), updated_at: new Date().toISOString() } as any;
        // embed lightweight learning_dna pointer
        const dna = await learningDnaRepo.getLearningDNA(fb.user_id!).catch(() => null);
        newProj.learning_dna = (dna && (dna as any).traits) || {};
        await dashboardRepo.upsertDashboardProjection(fb.user_id!, newProj).catch(() => null);
      } catch {}

    } catch (e) {
      // non-fatal
    }

    return res;
  }
}

// named exports are declared on each class above
