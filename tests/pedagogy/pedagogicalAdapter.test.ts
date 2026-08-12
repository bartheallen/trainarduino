import { describe, it, expect } from 'vitest';
import { buildPedagogicalReport } from '@/lib/pedagogy/PedagogicalEngine';

describe('PedagogicalAdapter', () => {
  it('produces feedback and review guidance from a correction report', async () => {
    const report = await buildPedagogicalReport({
      correction: {
        generatedAt: new Date().toISOString(),
        summary: { errors: 2, warnings: 1, infos: 0, issuesCount: 3 },
        issues: [
          { id: '1', category: 'syntax', message: 'Missing semicolon', severity: 'error' },
          { id: '2', category: 'logic', message: 'Pin not initialized', severity: 'warning' },
        ],
      },
      context: { userId: 'user-1' },
    });

    expect(report.shortFeedback).toBeTruthy();
    expect(report.longFeedback).toBeTruthy();
    expect(report.reviewSchedule.length).toBeGreaterThan(0);
    expect(report.hints.length).toBeGreaterThan(0);
  });
});
