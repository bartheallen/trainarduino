export interface ScoreContext {
  userId?: string;
  learningProfile?: any;
  mission?: any;
  candidate?: any;
}

export interface ScoreResult {
  key: string;
  score: number;
  reason?: string;
}

export interface ScoreCalculator {
  key: string;
  calculate(context: ScoreContext): Promise<ScoreResult> | ScoreResult;
}

export interface RecommendationCandidate {
  id: string;
  type: string; // mission|exercise|project|review
  payload: any;
}

export interface RecommendationStrategy {
  score(candidates: RecommendationCandidate[], context: ScoreContext): Promise<Array<{ candidate: RecommendationCandidate; score: number; rationale: ScoreResult[] }>>;
}
