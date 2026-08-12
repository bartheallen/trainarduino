import { describe, expect, it } from 'vitest';
import { validatePracticalExercise } from '@/lib/services/practicalValidationService';

describe('validatePracticalExercise', () => {
  it('échoue quand aucun code n’est fourni', () => {
    const result = validatePracticalExercise('', {
      id: 1,
      module_id: 1,
      titre: 'Blink',
      enonce: 'Make an LED blink',
      critere_correction: 'LED should blink',
      exemple_solution: null,
      xp_recompense: 50,
      difficulte: 'easy',
      wokwi_project_url: null,
      ordre: 1,
      created_at: '',
      updated_at: '',
    } as any);

    expect(result.passed).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes('Le code est vide'))).toBe(true);
  });

  it('réussit quand le code contient setup, loop, pinMode et delay', () => {
    const result = validatePracticalExercise(`void setup() { pinMode(13, OUTPUT); }
void loop() { digitalWrite(13, HIGH); delay(1000); digitalWrite(13, LOW); delay(1000); }`, {
      id: 1,
      module_id: 1,
      titre: 'Blink',
      enonce: 'Make an LED blink',
      critere_correction: 'LED should blink',
      exemple_solution: null,
      xp_recompense: 50,
      difficulte: 'easy',
      wokwi_project_url: null,
      ordre: 1,
      created_at: '',
      updated_at: '',
    } as any);

    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThan(60);
  });
});
