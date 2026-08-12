import type { Analyzer, Issue } from '@/lib/correction/types';

export const MemoryAnalyzer: Analyzer = {
  name: 'memory-analyzer',
  async analyze(code: string): Promise<Issue[]> {
    const issues: Issue[] = [];

    if (/\bString\s+[a-zA-Z_][a-zA-Z0-9_]*\b/.test(code)) {
      issues.push({
        id: 'memory-string-usage',
        category: 'memory',
        severity: 'warning',
        line: code.split('\n').findIndex((line) => /\bString\s+[a-zA-Z_]/.test(line)) + 1,
        message: 'Usage de String en Arduino, ce qui peut fragmenter la mémoire heap.',
        correction: 'Préférez des tableaux de caractères ou des chaînes littérales constantes.',
        example: 'char buffer[32];',
        documentationUrl: 'https://www.arduino.cc/reference/en/language/variables/data-types/stringobject/',
      });
    }

    const dynamicAlloc = /\b(malloc|free|new|delete)\b/.exec(code);
    if (dynamicAlloc) {
      issues.push({
        id: 'memory-dynamic-allocation',
        category: 'memory',
        severity: 'warning',
        line: code.slice(0, dynamicAlloc.index).split('\n').length,
        message: `Allocation dynamique détectée : ${dynamicAlloc[1]}.`,
        correction: 'Évitez malloc/new sur microcontrôleur si possible et utilisez des buffers statiques.',
        example: 'static uint8_t buffer[128];',
        documentationUrl: null,
      });
    }

    const largeArray = /\b(?:int|long|float|char|byte|uint8_t|uint16_t|uint32_t)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\[\s*(\d{4,})\s*\]/g;
    for (const match of code.matchAll(largeArray)) {
      issues.push({
        id: 'memory-large-array',
        category: 'memory',
        severity: 'warning',
        line: code.slice(0, match.index).split('\n').length,
        message: `Tableau potentiellement trop grand : ${match[1]}[${match[2]}].`,
        correction: 'Réduisez la taille du tableau ou déplacez-le vers la mémoire externe si disponible.',
        example: `const int ${match[1]}[512];`,
        documentationUrl: null,
      });
    }

    const globals = /\b(?:int|long|float|char|byte|uint8_t|uint16_t|uint32_t|String)\s+([A-Za-z_][A-Za-z0-9_]*)\s*;/g;
    const globalCount = Array.from(code.matchAll(globals)).length;
    if (globalCount > 10) {
      issues.push({
        id: 'memory-too-many-globals',
        category: 'memory',
        severity: 'info',
        line: 1,
        message: `Nombre élevé de variables globales détecté : ${globalCount}.`,
        correction: 'Regroupez les variables en structures ou limitez les globals pour économiser la mémoire.',
        example: 'static int sensorValues[8];',
        documentationUrl: null,
      });
    }

    return issues;
  },
};
