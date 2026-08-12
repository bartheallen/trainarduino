import type { PedagogicalEngineContext } from './PedagogicalReport';
import type { CorrectionReport } from '@/lib/correction/types';

export function detectGaps(correction: CorrectionReport, _context?: PedagogicalEngineContext) {
  const weak: string[] = [];
  const strong: string[] = [];
  const misconceptions: string[] = [];

  for (const issue of correction.issues) {
    if (issue.category === 'syntax' || issue.category === 'logic') {
      weak.push(issue.message);
    }
    if (issue.category === 'electronics' && issue.severity === 'info') {
      strong.push(issue.message);
    }
    if (issue.message.toLowerCase().includes('misunderstand') || issue.message.toLowerCase().includes('confuse')) {
      misconceptions.push(issue.message);
    }
  }

  return { weakConcepts: Array.from(new Set(weak)).slice(0, 10), strongConcepts: Array.from(new Set(strong)).slice(0, 10), misconceptions };
}
