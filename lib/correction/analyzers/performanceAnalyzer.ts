import type { Analyzer, Issue } from '@/lib/correction/types';

export const PerformanceAnalyzer: Analyzer = {
  name: 'performance-analyzer',
  async analyze(code: string): Promise<Issue[]> {
    const issues: Issue[] = [];

    const delayMatches = Array.from(code.matchAll(/delay\s*\(\s*(\d+)\s*\)/g));
    for (const match of delayMatches) {
      const ms = Number(match[1]);
      issues.push({
        id: `performance-delay-${ms}`,
        category: 'performance',
        severity: ms >= 1000 ? 'warning' : 'info',
        line: code.slice(0, match.index).split('\n').length,
        message: `delay(${ms}) détecté, impacte la réactivité.`,
        correction: 'Préférez un mécanisme non bloquant avec millis().',
        example: 'if (millis() - lastMillis >= interval) { /* ... */ }',
        documentationUrl: null,
      });
    }

    if (/void\s+loop\s*\([^)]*\)\s*\{[\s\S]*?delay\s*\(/.test(code)) {
      issues.push({
        id: 'performance-delay-in-loop',
        category: 'performance',
        severity: 'warning',
        line: code.split('\n').findIndex((line) => /void\s+loop\s*\(/.test(line)) + 1,
        message: 'delay() utilisé dans loop(), ce qui bloque l’exécution continue.',
        correction: 'Utilisez millis() pour un chronométrage non bloquant.',
        example: 'if (millis() - previousMillis >= interval) { previousMillis = millis(); }',
        documentationUrl: null,
      });
    }

    if (/Serial\.print\s*\(/.test(code) && /void\s+loop\s*\([^)]*\)\s*\{[\s\S]*?Serial\.print\s*\(/.test(code)) {
      issues.push({
        id: 'performance-serial-print-loop',
        category: 'performance',
        severity: 'info',
        line: code.split('\n').findIndex((line) => /Serial\.print\s*\(/.test(line)) + 1,
        message: 'Serial.print() dans loop() peut ralentir le code.',
        correction: 'Limitez les impressions série ou faites-les moins fréquemment.',
        example: 'if (millis() - lastSerial >= 1000) { Serial.print(...); }',
        documentationUrl: null,
      });
    }

    if (/millis\s*\(\s*\)/.test(code) && !/delay\s*\(\s*\d+\s*\)/.test(code)) {
      issues.push({
        id: 'performance-millis-preferred',
        category: 'performance',
        severity: 'info',
        line: 1,
        message: 'millis() utilisé, ce qui est généralement plus performant que delay().',
        correction: 'Continuez à privilégier les temporisations non bloquantes.',
        example: 'unsigned long current = millis();',
        documentationUrl: null,
      });
    }

    return issues;
  },
};
