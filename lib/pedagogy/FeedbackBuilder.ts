import type { PedagogicalReport } from './PedagogicalReport';
import type { CorrectionReport } from '@/lib/correction/types';

export function buildFeedback(report: PedagogicalReport): { short: string; long: string } {
  const short = `Score ${Math.round(report.overallScore * 100)}%. Next: ${report.nextObjective ?? 'practice recommended'}`;
  const longParts: string[] = [];
  longParts.push(`Overall: score=${report.overallScore}`);
  if (report.weakConcepts.length) longParts.push(`Weak concepts: ${report.weakConcepts.join(', ')}`);
  if (report.recommendedExercises.length) longParts.push(`Exercises: ${report.recommendedExercises.join(', ')}`);
  if (report.recommendedLessons.length) longParts.push(`Lessons: ${report.recommendedLessons.join(', ')}`);
  if (report.misconceptions.length) longParts.push(`Misconceptions: ${report.misconceptions.join('; ')}`);

  return { short, long: longParts.join('\n') };
}

export function buildFeedbackFromCorrection(correction: CorrectionReport) {
  // lightweight fallback
  const report: Partial<PedagogicalReport> = {
    overallScore: Math.max(0, 1 - correction.summary.errors * 0.25 - correction.summary.warnings * 0.05),
    shortFeedback: `Correction completed: ${correction.summary.errors} errors, ${correction.summary.warnings} warnings`,
    longFeedback: JSON.stringify(correction, null, 2),
  };

  return report as PedagogicalReport;
}
