export type Severity = 'info' | 'warning' | 'error' | 'critical';

export type IssueCategory =
  | 'syntax'
  | 'logic'
  | 'electronics'
  | 'performance'
  | 'style'
  | 'memory'
  | 'other';

export interface Issue {
  id: string;
  category: IssueCategory;
  severity: Severity;
  line?: number | null;
  message: string;
  correction?: string | null;
  example?: string | null;
  documentationUrl?: string | null;
}

export interface CorrectionSummary {
  issuesCount: number;
  errors: number;
  warnings: number;
  infos: number;
}

export interface CorrectionReport {
  engineVersion?: string;
  generatedAt: string;
  issues: Issue[];
  summary: CorrectionSummary;
  metadata?: Record<string, any>;
}

export interface CorrectionContext {
  userId?: string | null;
  exerciseId?: number | null;
  submissionId?: number | null;
  language?: string | null;
  // optional learning memory snapshot or other context provided by caller
  memory?: Record<string, any> | null;
}

export interface Analyzer {
  name: string;
  analyze(code: string, context?: CorrectionContext): Promise<Issue[]>;
}
