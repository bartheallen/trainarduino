import { describe, it, expect } from 'vitest';
import { buildFeedback, buildFeedbackFromCorrection } from '@/lib/pedagogy/FeedbackBuilder';

describe('FeedbackBuilder', () => {
  it('builds short and long feedback from a pedagogical report', () => {
    const fake = { overallScore: 0.75, weakConcepts: ['pins'], recommendedExercises: ['ex1'], recommendedLessons: ['l1'], misconceptions: [] } as any;
    const fb = buildFeedback(fake);
    expect(typeof fb.short).toBe('string');
    expect(typeof fb.long).toBe('string');
  });

  it('builds fallback feedback from correction', () => {
    const correction = { summary: { errors: 2, warnings: 1 } } as any;
    const fb = buildFeedbackFromCorrection(correction);
    expect(fb.overallScore).toBeDefined();
    expect(fb.shortFeedback).toBeDefined();
  });
});
