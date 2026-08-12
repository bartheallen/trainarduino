import type { Exercise } from '@/lib/types';
import type { PracticalAiCriteria } from './practicalAiAnalysisService';

export interface PracticalValidationIssue {
  severity: 'error' | 'warning' | 'success';
  message: string;
  hint: string;
}

export interface PracticalValidationResult {
  passed: boolean;
  score: number;
  issues: PracticalValidationIssue[];
  criteriaChecked: string[];
  criteriaPassed: string[];
  criteriaFailed: string[];
  summary: string;
  canInspectWokwi: boolean;
  wokwiUrlAvailable: boolean;
}

interface PracticalCriterion {
  id: string;
  label: string;
  required: boolean;
  satisfied: boolean;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function extractPinNumbers(code: string): { pins: number[]; namedUsed: boolean } {
  const pinsSet = new Set<number>();
  let namedUsed = false;

  // Find simple numeric usages first
  const numericRegex = /\b(?:pinMode|digitalWrite|digitalRead|analogWrite|analogRead)\s*\(\s*(\d+)\b/g;
  for (const match of code.matchAll(numericRegex)) {
    const value = Number(match[1]);
    if (!Number.isNaN(value)) pinsSet.add(value);
  }

  // Collect constant/define declarations: #define NAME 13  OR const int NAME = 13; OR int NAME = 13;
  const mapping = new Map<string, number>();
  const defineRe = /#\s*define\s+([A-Za-z_]\w*)\s+(\d+)/g;
  for (const m of code.matchAll(defineRe)) {
    const name = m[1];
    const value = Number(m[2]);
    if (!Number.isNaN(value)) mapping.set(name, value);
  }
  const constRe = /\b(?:const\s+int|int)\s+([A-Za-z_]\w*)\s*=\s*(\d+)\b/g;
  for (const m of code.matchAll(constRe)) {
    const name = m[1];
    const value = Number(m[2]);
    if (!Number.isNaN(value)) mapping.set(name, value);
  }

  // Find usages where the first argument may be an identifier
  const callRe = /\b(?:pinMode|digitalWrite|digitalRead|analogWrite|analogRead)\s*\(\s*([^,\)\s]+)/g;
  for (const match of code.matchAll(callRe)) {
    let arg = match[1].trim();
    // Strip common wrappers like (LED)
    arg = arg.replace(/^\(+|\)+$/g, '');
    if (/^\d+$/.test(arg)) {
      pinsSet.add(Number(arg));
      continue;
    }
    // If it's an identifier, try to resolve via mapping
    const simpleIdent = /^([A-Za-z_]\w*)$/.exec(arg);
    if (simpleIdent) {
      const name = simpleIdent[1];
      const mapped = mapping.get(name);
      if (typeof mapped === 'number') {
        pinsSet.add(mapped);
      } else {
        // Identifier present but not resolvable locally — treat as used
        namedUsed = true;
      }
    }
  }

  return { pins: Array.from(pinsSet), namedUsed };
}

function extractDelays(code: string): number[] {
  const delays = new Set<number>();
  const regex = /delay\s*\(\s*(\d+)/g;
  for (const match of code.matchAll(regex)) {
    const value = Number(match[1]);
    if (!Number.isNaN(value)) {
      delays.add(value);
    }
  }
  return Array.from(delays);
}

function buildCriteria(code: string, criteriaText: string): PracticalCriterion[] {
  const hasSetup = /\bsetup\s*\(/.test(code);
  const hasLoop = /\bloop\s*\(/.test(code);
  const hasPinMode = /pinMode\s*\(/.test(code);
  const hasDigitalWrite = /digitalWrite\s*\(/.test(code);
  const hasDigitalRead = /digitalRead\s*\(/.test(code);
  const hasSerialBegin = /Serial\.begin\s*\(/.test(code);
  const hasSerialPrint = /Serial\.(print|println)\s*\(/.test(code);
  const hasDelay = extractDelays(code).length > 0;
  const { pins, namedUsed } = extractPinNumbers(code);

  const criteria: PracticalCriterion[] = [
    { id: 'setup', label: 'setup() présent', required: true, satisfied: hasSetup },
    { id: 'loop', label: 'loop() présent', required: true, satisfied: hasLoop },
  ];

  const mentionsBlink = criteriaText.includes('blink') || criteriaText.includes('clign') || criteriaText.includes('led');
  if (mentionsBlink) {
    criteria.push(
      { id: 'pinmode', label: 'pinMode() utilisé', required: true, satisfied: hasPinMode },
      { id: 'digitalwrite', label: 'digitalWrite() utilisé', required: true, satisfied: hasDigitalWrite },
      { id: 'delay', label: 'delay() utilisé', required: true, satisfied: hasDelay },
      { id: 'pinusage', label: 'broche utilisée dans le code', required: true, satisfied: pins.length > 0 || namedUsed },
    );
  }

  const mentionsSerial = criteriaText.includes('serial') || criteriaText.includes('monitor');
  if (mentionsSerial) {
    criteria.push(
      { id: 'serial-begin', label: 'Serial.begin() utilisé', required: true, satisfied: hasSerialBegin },
      { id: 'serial-print', label: 'sortie série détectée', required: true, satisfied: hasSerialPrint },
    );
  }

  const mentionsButton = criteriaText.includes('button') || criteriaText.includes('pushbutton');
  if (mentionsButton) {
    criteria.push({ id: 'digitalread', label: 'digitalRead() utilisé', required: true, satisfied: hasDigitalRead });
  }

  return criteria;
}

export function validatePracticalExercise(code: string, exercise?: Exercise | null, aiCriteria?: PracticalAiCriteria | null): PracticalValidationResult {
  const issues: PracticalValidationIssue[] = [];
  const criteriaText = normalize([exercise?.enonce ?? '', exercise?.critere_correction ?? '', exercise?.circuit_instructions ?? ''].filter(Boolean).join('\n'));
  const codeText = code.trim();
  const criteria = buildCriteria(code, criteriaText).map((criterion) => {
    if (criterion.id === 'pinusage' && aiCriteria?.pin_used === true) return { ...criterion, satisfied: true };
    if (criterion.id === 'pinmode' && aiCriteria?.pin_mode_configured === true) return { ...criterion, satisfied: true };
    if (criterion.id === 'digitalwrite' && aiCriteria?.digital_output_used === true) return { ...criterion, satisfied: true };
    if (criterion.id === 'delay' && aiCriteria?.delay_used === true) return { ...criterion, satisfied: true };
    return criterion;
  });
  const criteriaPassed = criteria.filter((criterion) => criterion.satisfied).map((criterion) => criterion.label);
  const criteriaFailed = criteria.filter((criterion) => !criterion.satisfied && criterion.required).map((criterion) => criterion.label);
  const criteriaChecked = [...criteriaPassed];

  if (!codeText) {
    issues.push({ severity: 'error', message: 'Le code est vide.', hint: 'Ajoutez un programme Arduino avant la validation.' });
  }

  for (const criterion of criteria) {
    if (!criterion.satisfied && criterion.required) {
      issues.push({ severity: 'error', message: `Critère non respecté : ${criterion.label}.`, hint: 'Adaptez votre code au critère demandé par l’exercice.' });
    }
  }

  const mentionsBlink = criteriaText.includes('blink') || criteriaText.includes('clign') || criteriaText.includes('led');
  if (mentionsBlink) {
    const pinsInfo = extractPinNumbers(code);
    const expectedPin = criteriaText.match(/\bpin\s*(\d+)\b/)?.[1];
    if (pinsInfo.pins.length === 0 && !pinsInfo.namedUsed && aiCriteria?.pin_used !== true) {
      issues.push({ severity: 'warning', message: 'Aucune broche utilisée n’a été détectée.', hint: 'Sélectionnez une broche dans votre code Arduino.' });
    }
    if (expectedPin && pinsInfo.pins.length > 0 && !pinsInfo.pins.includes(Number(expectedPin))) {
      issues.push({ severity: 'error', message: `La broche ${expectedPin} attendue n’est pas utilisée.`, hint: `Modifiez votre code pour utiliser la broche ${expectedPin}.` });
    }
  }

  if (criteriaText.includes('resistance') || criteriaText.includes('résistance')) {
    issues.push({ severity: 'warning', message: 'La validation actuelle ne peut pas vérifier directement la présence physique d’un composant Wokwi.', hint: 'Le circuit doit être vérifié manuellement dans la simulation Wokwi.' });
  }

  const hasCriticalErrors = issues.some((issue) => issue.severity === 'error');
  const score = Math.max(0, Math.min(100, 40 + (criteriaPassed.length * 10) - (issues.filter((issue) => issue.severity === 'error').length * 20)));
  const passed = !hasCriticalErrors && score >= 60;

  return {
    passed,
    score: Math.round(score),
    issues,
    criteriaChecked,
    criteriaPassed,
    criteriaFailed,
    summary: passed
      ? 'Validation pratique réussie sur la base du code Arduino et des critères de l’exercice.'
      : 'Validation pratique non réussie : des critères essentiels ne sont pas respectés.',
    canInspectWokwi: false,
    wokwiUrlAvailable: Boolean(exercise?.wokwi_project_url),
  };
}
