import { describe, expect, it } from 'vitest';
import { evaluatePracticalModuleCompletion } from '@/lib/services/practicalModuleCompletion';

describe('evaluatePracticalModuleCompletion', () => {
  it('ne termine pas le module si le test pratique échoue', () => {
    const result = evaluatePracticalModuleCompletion({
      allLessonsCompleted: true,
      practicalTestPassed: false,
      practicalTestCompleted: true,
    });

    expect(result.status).toBe('in_progress');
    expect(result.practicalTestPassed).toBe(false);
    expect(result.canCompleteModule).toBe(false);
  });

  it('termine le module même si toutes les leçons ne sont pas terminées lorsque le test pratique réussit', () => {
    const result = evaluatePracticalModuleCompletion({
      allLessonsCompleted: false,
      practicalTestPassed: true,
      practicalTestCompleted: true,
    });

    expect(result.status).toBe('completed');
    expect(result.practicalTestPassed).toBe(true);
    expect(result.canCompleteModule).toBe(true);
  });

  it('ne termine pas le module si le test pratique n’est pas encore complété, même si le passed est vrai', () => {
    const result = evaluatePracticalModuleCompletion({
      allLessonsCompleted: true,
      practicalTestPassed: true,
      practicalTestCompleted: false,
    });

    expect(result.status).toBe('in_progress');
    expect(result.practicalTestPassed).toBe(true);
    expect(result.canCompleteModule).toBe(false);
  });

  it('termine le module si toutes les leçons sont faites et que le test pratique réussit', () => {
    const result = evaluatePracticalModuleCompletion({
      allLessonsCompleted: true,
      practicalTestPassed: true,
      practicalTestCompleted: true,
    });

    expect(result.status).toBe('completed');
    expect(result.practicalTestPassed).toBe(true);
    expect(result.canCompleteModule).toBe(true);
  });
});
