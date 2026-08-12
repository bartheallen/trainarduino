import type { CorrectionReport } from '@/lib/correction/types';

export function predictProgress(correction: CorrectionReport) {
  const errors = correction.summary.errors || 0;
  const warnings = correction.summary.warnings || 0;
  const base = Math.max(0, 1 - errors * 0.25 - warnings * 0.05);
  const estimatedMastery = Math.round(base * 100);
  const difficulty = Math.min(5, 1 + Math.ceil((errors + warnings) / 2));
  return { estimatedMastery, difficulty };
}
