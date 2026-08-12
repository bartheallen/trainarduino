import type { Analyzer, Issue } from '@/lib/correction/types';

export const StyleAnalyzer: Analyzer = {
  name: 'style-analyzer',
  async analyze(code: string): Promise<Issue[]> {
    const issues: Issue[] = [];
    const lines = code.split('\n');

    const longFunctions = Array.from(code.matchAll(/\b(?:void|int|float|double|bool|char|byte|long)\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/g));
    for (const match of longFunctions) {
      const body = match[1];
      const count = body.split('\n').length;
      if (count > 25) {
        issues.push({
          id: 'style-long-function',
          category: 'style',
          severity: 'info',
          line: code.slice(0, (match.index ?? 0)).split('\n').length,
          message: `Fonction trop longue (${count} lignes).`,
          correction: 'Divisez la fonction en sous-fonctions plus petites et plus lisibles.',
          example: 'void handleSensors() { readSensors(); processValues(); }',
          documentationUrl: null,
        });
      }
    }

    const magicNumbers = lines.filter((line) => /\b\d{2,}\b/.test(line) && !/\b(const|#define)\b/.test(line));
    if (magicNumbers.length > 0) {
      issues.push({
        id: 'style-magic-numbers',
        category: 'style',
        severity: 'info',
        line: lines.findIndex((line) => magicNumbers.includes(line)) + 1,
        message: 'Nombres magiques détectés dans le code.',
        correction: 'Remplacez-les par des constantes nommées pour améliorer la lisibilité.',
        example: 'const int LED_PIN = 13;',
        documentationUrl: null,
      });
    }

    const indentIssues = lines.filter((line) => /^\s+/.test(line) && line.includes('  ') && !/\t/.test(line));
    if (indentIssues.length > 5) {
      issues.push({
        id: 'style-indentation',
        category: 'style',
        severity: 'info',
        line: lines.indexOf(indentIssues[0]) + 1,
        message: 'Indentation irrégulière détectée.',
        correction: 'Utilisez une indentation cohérente, typiquement 2 ou 4 espaces.',
        example: '  if (condition) {',
        documentationUrl: null,
      });
    }

    return issues;
  },
};
