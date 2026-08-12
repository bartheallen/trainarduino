import type { Exercise } from '@/lib/types';

export type ValidationSeverity = 'error' | 'warning' | 'success';

export interface ValidationIssue {
  severity: ValidationSeverity;
  message: string;
  hint: string;
}

export interface ValidationResult {
  score: number;
  passed: boolean;
  issues: ValidationIssue[];
  xpAwarded: number;
  verdict: 'success' | 'warning' | 'error';
}

const REQUIRED_PATTERNS = [
  { pattern: /setup\s*\(/, message: 'La fonction setup() est manquante.', hint: 'Ajoutez une fonction setup() pour initialiser les broches.' },
  { pattern: /loop\s*\(/, message: 'La fonction loop() est manquante.', hint: 'Ajoutez une boucle principale pour exécuter le programme.' },
];

const OPTIONAL_PATTERNS = [
  { pattern: /pinMode\s*\(/, message: 'Configuration des broches détectée.', hint: 'Bonne base pour piloter vos composants.' },
  { pattern: /digitalWrite\s*\(/, message: 'Écriture numérique détectée.', hint: 'Vous pilotez bien un état logique.' },
  { pattern: /digitalRead\s*\(/, message: 'Lecture numérique détectée.', hint: 'Vous pouvez réagir à un capteur.' },
  { pattern: /analogRead\s*\(/, message: 'Lecture analogique détectée.', hint: 'Vous exploitez des valeurs continues.' },
  { pattern: /analogWrite\s*\(/, message: 'Écriture analogique détectée.', hint: 'Vous générez un signal modulé.' },
  { pattern: /\b(if|for|while|switch)\b/, message: 'Logique de contrôle détectée.', hint: 'L’algorithme commence à prendre forme.' },
  { pattern: /\/\//, message: 'Commentaires présents.', hint: 'Le code reste plus lisible.' },
];

function getBraceBalance(code: string): number {
  let balance = 0;
  for (const char of code) {
    if (char === '{') balance += 1;
    if (char === '}') balance -= 1;
  }
  return balance;
}

function getParenthesisBalance(code: string): number {
  let balance = 0;
  for (const char of code) {
    if (char === '(') balance += 1;
    if (char === ')') balance -= 1;
  }
  return balance;
}

export function validateArduinoCode(code: string, exercise?: Exercise | null): ValidationResult {
  const issues: ValidationIssue[] = [];
  const trimmed = code.trim();

  if (!trimmed) {
    issues.push({
      severity: 'error',
      message: 'Le code est vide.',
      hint: 'Commencez par définir setup() et loop().',
    });
  }

  REQUIRED_PATTERNS.forEach(({ pattern, message, hint }) => {
    if (!pattern.test(code)) {
      issues.push({ severity: 'error', message, hint });
    }
  });

  OPTIONAL_PATTERNS.forEach(({ pattern, message, hint }) => {
    if (pattern.test(code)) {
      issues.push({ severity: 'success', message, hint });
    }
  });

  if (getBraceBalance(code) !== 0) {
    issues.push({
      severity: 'warning',
      message: 'Les accolades ne sont pas équilibrées.',
      hint: 'Vérifiez les blocs de code et les fermetures.',
    });
  }

  if (getParenthesisBalance(code) !== 0) {
    issues.push({
      severity: 'warning',
      message: 'Les parenthèses ne sont pas équilibrées.',
      hint: 'Contrôlez les appels de fonction et les conditions.',
    });
  }

  const detectedSuccesses = issues.filter((issue) => issue.severity === 'success').length;
  const totalScore = Math.max(0, Math.min(100, 35 + detectedSuccesses * 10));
  const passed = issues.filter((issue) => issue.severity === 'error').length === 0 && totalScore >= 60;

  return {
    score: totalScore,
    passed,
    issues,
    xpAwarded: exercise?.xp_recompense ? Math.max(10, Math.round(exercise.xp_recompense * (totalScore / 100))) : 25,
    verdict: passed ? 'success' : issues.some((issue) => issue.severity === 'warning') ? 'warning' : 'error',
  };
}
