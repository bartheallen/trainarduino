import type { CorrectionReport } from '@/lib/correction/types';

export type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced';

export interface PedagogicalReport {
  overallScore: number;
  knowledgeLevel: KnowledgeLevel;
  difficulty: number; // 1-5
  mistakes: Array<{ id: string; category: string; message: string; severity: string; line?: number | null }>;
  weakConcepts: string[];
  strongConcepts: string[];
  misconceptions: string[];
  recommendedLessons: string[];
  recommendedExercises: string[];
  recommendedProjects: string[];
  reviewSchedule: Array<{ concept: string; when: string; urgency: 'low' | 'medium' | 'high' }>;
  nextObjective?: string;
  confidence?: number; // 0-100
  estimatedMastery?: Record<string, number>;
  studentExplanation?: string;
  teacherExplanation?: string;
  shortFeedback?: string;
  longFeedback?: string;
  socraticQuestions: string[];
  hints: string[];
  learningObjectives: string[];
  // keep original correction report for traceability
  rawCorrection?: CorrectionReport;
}

export interface PedagogicalEngineContext {
  userId?: string | null;
  exerciseId?: number | null;
  submissionId?: number | null;
}

export type PedagogicalReportInput = {
  correction: CorrectionReport;
  context?: PedagogicalEngineContext;
};

export default PedagogicalReport;
