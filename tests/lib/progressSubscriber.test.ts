import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => {
  return {
    getExercise: vi.fn(),
    getModuleProgress: vi.fn(),
    getModuleLessonProgressMetrics: vi.fn(),
    getModuleProgressMetrics: vi.fn(),
    moduleHasPracticalTest: vi.fn(),
    updateModuleProgress: vi.fn().mockResolvedValue(null),
    updateCurrentModule: vi.fn().mockResolvedValue(null),
    unlockNextModule: vi.fn().mockResolvedValue(null),
  };
});

import { makeEvent } from '@/lib/events/utils';
import { defaultPublisher } from '@/lib/events/publisher';
import { defaultEventBus } from '@/lib/events/eventBus';
import { initializeEventSystem } from '@/lib/events/bootstrap';
import * as db from '@/lib/db';

// Import subscriber to register handlers
import '@/lib/events/subscribers/progressSubscriber';

describe('progressSubscriber', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    initializeEventSystem();
    (db.getModuleProgress as any).mockResolvedValue(null);
  });

  it('termine le module même si les leçons ne sont pas terminées lorsque le test pratique réussit', async () => {
    const exerciseId = 101;
    (db.getExercise as any).mockResolvedValue({ id: exerciseId, module_id: 20 });
    (db.getModuleLessonProgressMetrics as any).mockResolvedValue({ allLessonsCompleted: false, completionPercent: 50, completedLessons: 1, totalLessons: 2 });
    (db.getModuleProgressMetrics as any).mockResolvedValue({ completedExercises: 0, totalExercises: 0 });
    (db.moduleHasPracticalTest as any).mockResolvedValue(true);

    const eventName = 'ExerciseValidated';
    expect(defaultEventBus.listSubscribers(eventName).length).toBeGreaterThan(0);

    const ev = makeEvent({ name: eventName, version: 1, source: 'exercise', userId: 'u1', payload: { exerciseId, type: 'practical', passed: true } });
    await defaultPublisher.publish(ev as any);

    // updateModuleProgress should be called with completed
    expect((db.updateModuleProgress as any).mock.calls.length).toBeGreaterThan(0);
    const args = (db.updateModuleProgress as any).mock.calls[0];
    expect(args[2]).toBe('completed');
    // unlockNextModule should be called
    expect((db.unlockNextModule as any).mock.calls.length).toBeGreaterThan(0);
  });

  it('reste in_progress si simulation non confirmée', async () => {
    const exerciseId = 102;
    (db.getExercise as any).mockResolvedValue({ id: exerciseId, module_id: 21 });
    (db.getModuleLessonProgressMetrics as any).mockResolvedValue({ allLessonsCompleted: true, completionPercent: 100, completedLessons: 3, totalLessons: 3 });
    (db.getModuleProgressMetrics as any).mockResolvedValue({ completedExercises: 0, totalExercises: 0 });
    (db.moduleHasPracticalTest as any).mockResolvedValue(true);

    // Publish an ExerciseValidated that is NOT of type 'practical' (e.g., theory exercise)
    const ev = makeEvent({ name: 'ExerciseValidated', version: 1, source: 'exercise', userId: 'u2', payload: { exerciseId, type: 'theory', passed: false } });
    await defaultPublisher.publish(ev as any);

    expect((db.updateModuleProgress as any).mock.calls.length).toBeGreaterThan(0);
    const args = (db.updateModuleProgress as any).mock.calls[0];
    // since practicalTestCompleted is false, status should still be in_progress
    expect(args[2]).toBe('in_progress');
    expect((db.unlockNextModule as any).mock.calls.length).toBe(0);
  });

  it('termine le module et débloque le suivant quand tout est ok', async () => {
    const exerciseId = 103;
    (db.getExercise as any).mockResolvedValue({ id: exerciseId, module_id: 22 });
    (db.getModuleLessonProgressMetrics as any).mockResolvedValue({ allLessonsCompleted: true, completionPercent: 100, completedLessons: 2, totalLessons: 2 });
    (db.getModuleProgressMetrics as any).mockResolvedValue({ completedExercises: 0, totalExercises: 0 });
    (db.moduleHasPracticalTest as any).mockResolvedValue(true);

    const publishSpy = vi.spyOn(defaultPublisher, 'publish');

    const ev = makeEvent({ name: 'ExerciseValidated', version: 1, source: 'exercise', userId: 'u3', payload: { exerciseId, type: 'practical', passed: true } });
    await defaultPublisher.publish(ev as any);

    // updateModuleProgress should be called with 'completed'
    const calls = (db.updateModuleProgress as any).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const lastArgs = calls[calls.length - 1];
    expect(lastArgs[2]).toBe('completed');
    // unlockNextModule should be called
    expect((db.unlockNextModule as any).mock.calls.length).toBeGreaterThan(0);
    // ModuleCompleted event should have been published
    expect(publishSpy.mock.calls.some((c) => c[0].name === 'ModuleCompleted')).toBeTruthy();
  });
});
