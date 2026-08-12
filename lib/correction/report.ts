import type { CorrectionReport } from '@/lib/correction/types';

export function formatReportMarkdown(report: CorrectionReport) {
  const lines: string[] = [];
  lines.push(`# Correction report — generated ${report.generatedAt}`);
  lines.push(`Engine: ${report.engineVersion || 'unknown'}`);
  lines.push(`Issues: ${report.summary.issuesCount} (errors=${report.summary.errors} warnings=${report.summary.warnings})`);
  lines.push('');

  for (const issue of report.issues) {
    lines.push(`- [${issue.severity.toUpperCase()}] ${issue.category} — ${issue.message}${issue.line ? ` (line ${issue.line})` : ''}`);
    if (issue.correction) lines.push(`  - Correction: ${issue.correction}`);
    if (issue.example) lines.push(`  - Example: ${issue.example}`);
    if (issue.documentationUrl) lines.push(`  - Doc: ${issue.documentationUrl}`);
  }

  return lines.join('\n');
}
