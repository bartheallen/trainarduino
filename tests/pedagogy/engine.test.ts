import { describe, it, expect } from 'vitest';
import { buildPedagogicalReport } from '@/lib/pedagogy/PedagogicalEngine';

const sampleCorrection = {
  engineVersion: 'v0',
  generatedAt: new Date().toISOString(),
  issues: [
    { id: '1', category: 'syntax', severity: 'error', line: 3, message: 'Missing semicolon' },
    { id: '2', category: 'logic', severity: 'warning', line: 10, message: 'Off-by-one in loop' },
    { id: '3', category: 'electronics', severity: 'info', line: null, message: 'Consider pull-down resistor' },
  ],
  summary: { issuesCount: 3, errors: 1, warnings: 1, infos: 1 },
};

describe('PedagogicalEngine', () => {
  it('builds a pedagogical report from correction', async () => {
    const report = await buildPedagogicalReport({ correction: sampleCorrection as any, context: { userId: 'u1' } });
    expect(report).toHaveProperty('overallScore');
    expect(report.mistakes.length).toBeGreaterThan(0);
    expect(report.weakConcepts.length).toBeGreaterThanOrEqual(0);
    expect(report.hints.length).toBeGreaterThan(0);
  });
});
