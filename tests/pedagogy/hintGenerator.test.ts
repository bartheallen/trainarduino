import { describe, it, expect } from 'vitest';
import { generateHints } from '@/lib/pedagogy/HintGenerator';

const sampleCorrection = {
  issues: [
    { id: '1', category: 'syntax', severity: 'error', line: 4, message: 'Missing semicolon' },
    { id: '2', category: 'electronics', severity: 'warning', message: 'Pin mode not set' },
  ],
  summary: { issuesCount: 2, errors: 1, warnings: 1, infos: 0 },
} as any;

describe('HintGenerator', () => {
  it('generates hints from correction issues', () => {
    const hints = generateHints(sampleCorrection);
    expect(hints.length).toBeGreaterThan(0);
    expect(hints[0]).toContain('Check line');
  });
});
