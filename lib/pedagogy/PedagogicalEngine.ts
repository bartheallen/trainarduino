import type { PedagogicalReport, PedagogicalReportInput, PedagogicalEngineContext } from './PedagogicalReport';
import { detectGaps } from './LearningGapDetector';
import { generateHints } from './HintGenerator';
import { predictProgress } from './ProgressPredictor';
import { buildFeedback } from './FeedbackBuilder';

export async function buildPedagogicalReport(input: PedagogicalReportInput): Promise<PedagogicalReport> {
  const correction = input.correction;
  const context: PedagogicalEngineContext = input.context ?? {};

  const gaps = detectGaps(correction, context);
  const hints = generateHints(correction);
  const progress = predictProgress(correction);

  const report: PedagogicalReport = {
    overallScore: Math.max(0, 1 - correction.summary.errors * 0.25 - correction.summary.warnings * 0.05),
    knowledgeLevel: progress.estimatedMastery >= 80 ? 'advanced' : progress.estimatedMastery >= 50 ? 'intermediate' : 'beginner',
    difficulty: progress.difficulty,
    mistakes: correction.issues.map((i) => ({ id: i.id, category: i.category, message: i.message, severity: i.severity, line: i.line ?? null })),
    weakConcepts: gaps.weakConcepts,
    strongConcepts: gaps.strongConcepts,
    misconceptions: gaps.misconceptions,
    recommendedLessons: [],
    recommendedExercises: [],
    recommendedProjects: [],
    reviewSchedule: (gaps.weakConcepts || []).map((c) => ({ concept: c, when: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), urgency: 'high' as const })),
    nextObjective: `Fix ${correction.summary.errors} errors and ${correction.summary.warnings} warnings`,
    confidence: Math.round((1 - correction.summary.errors / Math.max(1, correction.summary.issuesCount || 1)) * 100),
    estimatedMastery: {},
    studentExplanation: undefined,
    teacherExplanation: undefined,
    shortFeedback: undefined,
    longFeedback: undefined,
    socraticQuestions: (correction.issues || []).slice(0, 5).map((i) => `Pourquoi ${i.message.replace(/\.$/, '')}?`),
    hints,
    learningObjectives: (gaps.weakConcepts || []).slice(0, 5).map((c) => `Comprendre ${c}`),
    rawCorrection: correction,
  };

  const fb = buildFeedback(report as PedagogicalReport);
  report.shortFeedback = fb.short;
  report.longFeedback = fb.long;

  return report;
}

export default buildPedagogicalReport;
