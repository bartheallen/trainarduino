import { describe, it, expect } from 'vitest';
import { predictProgress } from '@/lib/pedagogy/ProgressPredictor';

const sampleCorrection = {
  summary: { errors: 2, warnings: 1, issuesCount: 3 },
} as any;

describe('ProgressPredictor', () => {
  it('predicts mastery and difficulty from correction', () => {
    const res = predictProgress(sampleCorrection);
    expect(typeof res.estimatedMastery).toBe('number');
    expect(typeof res.difficulty).toBe('number');
  });
});
