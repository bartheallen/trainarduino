import type { Analyzer, Issue } from '@/lib/correction/types';

export const SyntaxAnalyzer: Analyzer = {
  name: 'syntax-basic',
  async analyze(code: string): Promise<Issue[]> {
    const issues: Issue[] = [];

    // Simple unbalanced braces check
    const open = (code.match(/{/g) || []).length;
    const close = (code.match(/}/g) || []).length;
    if (open !== close) {
      issues.push({
        id: 'syntax-unbalanced-braces',
        category: 'syntax',
        severity: 'error',
        line: null,
        message: `Braces appear unbalanced (open=${open} close=${close}).`,
        correction: 'Check matching { and } in functions and control blocks.',
        example: null,
        documentationUrl: null,
      });
    }

    // Simple parentheses balance check
    const openPar = (code.match(/\(/g) || []).length;
    const closePar = (code.match(/\)/g) || []).length;
    if (openPar !== closePar) {
      issues.push({
        id: 'syntax-unbalanced-parentheses',
        category: 'syntax',
        severity: 'error',
        line: null,
        message: `Parentheses appear unbalanced (open=${openPar} close=${closePar}).`,
        correction: 'Check matching ( and ) in function calls and expressions.',
        example: null,
        documentationUrl: null,
      });
    }

    // Very naive semicolon check: flag lines that look like statements without semicolon
    const lines = code.split('\n').map((l) => l.trim());
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (!l) continue;
      // skip comments and preprocessor
      if (l.startsWith('//') || l.startsWith('/*') || l.startsWith('#')) continue;
      // typical control lines and blocks
      if (/[;{}]$/.test(l)) continue;
      if (/\)\s*$/.test(l) && !/\bif\b|\bfor\b|\bwhile\b/.test(l)) {
        // might be a function call missing semicolon
        issues.push({
          id: `syntax-missing-semicolon-${i}`,
          category: 'syntax',
          severity: 'warning',
          line: i + 1,
          message: 'Possible missing semicolon at end of statement.',
          correction: 'Add a semicolon at the end of the statement.',
          example: null,
          documentationUrl: null,
        });
      }
    }

    return issues;
  },
};
