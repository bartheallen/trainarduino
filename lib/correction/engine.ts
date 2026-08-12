import { Analyzer, CorrectionContext, CorrectionReport, Issue } from '@/lib/correction/types';

export class ArduinoCorrectionEngine {
  private analyzers: Analyzer[] = [];
  version = '0.1.0';

  registerAnalyzer(analyzer: Analyzer) {
    this.analyzers.push(analyzer);
  }

  clearAnalyzers() {
    this.analyzers = [];
  }

  async analyze(code: string, context?: CorrectionContext): Promise<CorrectionReport> {
    const issues: Issue[] = [];
    for (const a of this.analyzers) {
      try {
        const found = await a.analyze(code, context);
        if (Array.isArray(found) && found.length) issues.push(...found);
      } catch (err) {
        issues.push({
          id: `analyzer-${a.name}-error`,
          category: 'other',
          severity: 'warning',
          line: null,
          message: `Analyzer ${a.name} failed: ${(err as Error).message}`,
          correction: null,
          example: null,
          documentationUrl: null,
        });
      }
    }

    const summary = {
      issuesCount: issues.length,
      errors: issues.filter((i) => i.severity === 'error' || i.severity === 'critical').length,
      warnings: issues.filter((i) => i.severity === 'warning').length,
      infos: issues.filter((i) => i.severity === 'info').length,
    };

    const report: CorrectionReport = {
      engineVersion: this.version,
      generatedAt: new Date().toISOString(),
      issues,
      summary,
      metadata: {},
    };

    return report;
  }
}

export const defaultArduinoCorrectionEngine = new ArduinoCorrectionEngine();
