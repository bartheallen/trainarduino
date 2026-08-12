import { describe, it, expect } from 'vitest';
import { detectGaps } from '@/lib/pedagogy/LearningGapDetector';

const sampleCorrection = {
  issues: [
    { id: '1', category: 'syntax', severity: 'error', message: 'Forgot semicolon' },
    { id: '2', category: 'electronics', severity: 'info', message: 'Use resistor' },
    { id: '3', category: 'logic', severity: 'warning', message: 'Loop condition wrong' },
  ],
  summary: { errors: 1, warnings: 1, infos: 1, issuesCount: 3 },
} as any;

describe('LearningGapDetector', () => {
  it('detects weak and strong concepts', () => {
    const gaps = detectGaps(sampleCorrection);
    expect(Array.isArray(gaps.weakConcepts)).toBeTruthy();
    expect(Array.isArray(gaps.strongConcepts)).toBeTruthy();
  });
});
