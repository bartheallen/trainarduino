import type { Analyzer, Issue } from '@/lib/correction/types';

function findMatches(code: string, regex: RegExp) {
  return Array.from(code.matchAll(regex)).map((m) => ({ match: m[0], index: m.index ?? 0 }));
}

export const LogicAnalyzer: Analyzer = {
  name: 'logic-analyzer',
  async analyze(code: string): Promise<Issue[]> {
    const issues: Issue[] = [];

    const infiniteLoops = findMatches(code, /for\s*\(\s*;;\s*\)|while\s*\(\s*1\s*\)|while\s*\(\s*true\s*\)/g);
    for (const entry of infiniteLoops) {
      issues.push({
        id: 'logic-infinite-loop',
        category: 'logic',
        severity: 'warning',
        line: code.slice(0, entry.index).split('\n').length,
        message: 'Probable boucle infinie détectée.',
        correction: 'Vérifiez le condition de sortie ou utilisez une condition basée sur une variable de garde.',
        example: 'while (millis() - start < 1000) { /* ... */ }',
        documentationUrl: null,
      });
    }

    const delayInLoop = findMatches(code, /void\s+loop\s*\([^)]*\)[^{]*\{[\s\S]*?delay\s*\(/g);
    for (const entry of delayInLoop) {
      issues.push({
        id: 'logic-delay-in-loop',
        category: 'logic',
        severity: 'warning',
        line: code.slice(0, entry.index).split('\n').length,
        message: 'Usage de delay() dans loop(), ce qui bloque le microcontrôleur.',
        correction: 'Préférez un contrôle basé sur millis() pour conserver la réactivité.',
        example: 'if (millis() - lastMillis >= interval) { /* ... */ }',
        documentationUrl: 'https://www.arduino.cc/reference/en/language/functions/time/millis/',
      });
    }

    const declarations = findMatches(code, /\b(int|float|double|char|bool|byte|long)\s+(\w+)\s*(=\s*[^;]+)?;/g);
    for (const decl of declarations) {
      const name = /\b(?:int|float|double|char|bool|byte|long)\s+(\w+)/.exec(decl.match)?.[1];
      if (!name) continue;
      const after = code.slice(decl.index + decl.match.length);
      if (!new RegExp(`\\b${name}\\b`).test(after)) {
        issues.push({
          id: `logic-unused-variable-${name}`,
          category: 'logic',
          severity: 'info',
          line: code.slice(0, decl.index).split('\n').length,
          message: `Variable déclarée mais jamais utilisée: ${name}.`,
          correction: 'Supprimez ou utilisez cette variable pour clarifier le code.',
          example: `int ${name} = 0; // utiliser ${name} ou supprimer la déclaration`,
          documentationUrl: null,
        });
      }
      if (!/=/g.test(decl.match)) {
        const usage = new RegExp(`\b${name}\b`).test(after);
        if (usage) {
          issues.push({
            id: `logic-uninitialized-variable-${name}`,
            category: 'logic',
            severity: 'warning',
            line: code.slice(0, decl.index).split('\n').length,
            message: `Variable potentiellement utilisée sans initialisation: ${name}.`,
            correction: `Initialisez ${name} lors de sa déclaration.`,
            example: `int ${name} = 0;`,
            documentationUrl: null,
          });
        }
      }
    }

    const ifAlwaysTrue = findMatches(code, /if\s*\(\s*(true|1)\s*\)/g);
    const ifAlwaysFalse = findMatches(code, /if\s*\(\s*(false|0)\s*\)/g);
    const funcs = findMatches(code, /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*\{/g);
    const funcNames = funcs
      .map((f) => /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/.exec(f.match)?.[1])
      .filter(Boolean) as string[];

    for (const entry of ifAlwaysTrue) {
      issues.push({
        id: 'logic-condition-always-true',
        category: 'logic',
        severity: 'warning',
        line: code.slice(0, entry.index).split('\n').length,
        message: 'Condition if toujours vraie détectée.',
        correction: 'Remplacez-la par une condition dynamique ou supprimez le if inutile.',
        example: 'if (sensorValue > threshold) { ... }',
        documentationUrl: null,
      });
    }

    for (const entry of ifAlwaysFalse) {
      issues.push({
        id: 'logic-condition-always-false',
        category: 'logic',
        severity: 'warning',
        line: code.slice(0, entry.index).split('\n').length,
        message: 'Condition if toujours fausse détectée.',
        correction: 'Vérifiez la logique de la condition et corrigez la valeur.',
        example: 'if (temperature < maxTemperature) { ... }',
        documentationUrl: null,
      });
    }

    const switchStatements = findMatches(code, /switch\s*\([^)]*\)\s*\{[\s\S]*?\}/g);
    for (const statement of switchStatements) {
      if (!/default\s*:\s*/.test(statement.match)) {
        issues.push({
          id: 'logic-switch-incomplete',
          category: 'logic',
          severity: 'info',
          line: code.slice(0, statement.index).split('\n').length,
          message: 'Switch sans clause default détecté.',
          correction: 'Ajoutez un défaut pour gérer les valeurs inattendues.',
          example: 'default: break;',
          documentationUrl: null,
        });
      }
    }

    const loopBodies = findMatches(code, /(?:for|while)\s*\([^)]*\)\s*\{\s*\}/g);
    for (const entry of loopBodies) {
      issues.push({
        id: 'logic-empty-loop',
        category: 'logic',
        severity: 'info',
        line: code.slice(0, entry.index).split('\n').length,
        message: 'Boucle vide détectée.',
        correction: 'Vérifiez que la boucle contient une logique utile ou supprimez-la.',
        example: 'while (condition) { doWork(); }',
        documentationUrl: null,
      });
    }

    for (const funcName of funcNames) {
      const uses = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
      const count = (code.match(uses) || []).length;
      if (count === 1) {
        issues.push({
          id: `logic-unused-function-${funcName}`,
          category: 'logic',
          severity: 'info',
          line: code.indexOf(funcName) >= 0 ? code.slice(0, code.indexOf(funcName)).split('\n').length : null,
          message: `Fonction ${funcName} définie mais jamais appelée.`,
          correction: 'Appelez la fonction ou supprimez-la si elle n’est plus utilisée.',
          example: `${funcName}();`,
          documentationUrl: null,
        });
      }
      if (new RegExp(`\\b${funcName}\\s*\([^)]*\)[\s\S]*\\b${funcName}\\s*\\(`).test(code)) {
        issues.push({
          id: `logic-recursive-function-${funcName}`,
          category: 'logic',
          severity: 'warning',
          line: code.indexOf(funcName) >= 0 ? code.slice(0, code.indexOf(funcName)).split('\n').length : null,
          message: `Fonction ${funcName} récursive détectée.`,
          correction: 'Vérifiez qu’il y a une condition de fin claire pour éviter la récursion infinie.',
          example: 'if (n <= 1) return 1; return n * factorial(n-1);',
          documentationUrl: null,
        });
      }
    }

    return issues;
  },
};
