import type { CorrectionReport } from '@/lib/correction/types';

export function generateHints(correction: CorrectionReport) {
  const hints: string[] = [];
  for (const issue of correction.issues) {
    if (issue.category === 'syntax') hints.push(`Check line ${issue.line ?? '?'}: ${issue.message}`);
    else if (issue.category === 'logic') hints.push(`Consider the control flow: ${issue.message}`);
    else if (issue.category === 'electronics') hints.push(`Verify wiring and pin modes: ${issue.message}`);
    else hints.push(issue.message);
  }
  return hints.slice(0, 10);
}
