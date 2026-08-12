import { RecommendationCandidate, ScoreCalculator, ScoreContext } from './interfaces';

export class RecommendationScoringEngine {
  calculators: ScoreCalculator[];

  constructor(calculators: ScoreCalculator[] = []) {
    this.calculators = calculators;
  }

  async score(candidates: RecommendationCandidate[], context: ScoreContext) {
    const results: Array<{ candidate: RecommendationCandidate; score: number; rationale: any[] }> = [];

    for (const candidate of candidates) {
      let total = 0;
      const rationale: any[] = [];
      const ctx = { ...context, candidate };
      for (const calc of this.calculators) {
        try {
          const res = await Promise.resolve(calc.calculate(ctx as any));
          total += res.score;
          rationale.push(res);
        } catch (e) {
          // ignore calculator errors but record
          rationale.push({ key: calc.key, score: 0, reason: 'error' });
        }
      }
      results.push({ candidate, score: total, rationale });
    }

    // sort desc
    results.sort((a, b) => b.score - a.score);
    return results;
  }
}
