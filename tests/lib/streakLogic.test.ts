import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as db from '@/lib/db';
import { defaultPublisher } from '@/lib/events/publisher';
import { initializeEventSystem } from '@/lib/events/bootstrap';
import { makeEvent } from '@/lib/events/utils';

const { calculateNextStreak } = db;

describe('calculateNextStreak', () => {
  it('starts at 1 on first activity', () => {
    expect(calculateNextStreak(0, null, '2026-01-10T10:00:00Z')).toBe(1);
  });

  it('increments on the second consecutive day', () => {
    expect(calculateNextStreak(1, '2026-01-10T10:00:00Z', '2026-01-11T08:00:00Z')).toBe(2);
  });

  it('continues for the third consecutive day', () => {
    expect(calculateNextStreak(2, '2026-01-11T10:00:00Z', '2026-01-12T09:00:00Z')).toBe(3);
  });

  it('keeps the streak unchanged for multiple activities in the same day', () => {
    expect(calculateNextStreak(2, '2026-01-12T09:00:00Z', '2026-01-12T18:00:00Z')).toBe(2);
  });

  it('resets to 1 after a missed day', () => {
    expect(calculateNextStreak(3, '2026-01-12T10:00:00Z', '2026-01-14T09:00:00Z')).toBe(1);
  });

  it('keeps the streak unchanged when the same day is processed again', () => {
    expect(calculateNextStreak(1, '2026-01-10T21:30:00+01:00', '2026-01-10T23:20:00+01:00', 'Europe/Paris')).toBe(1);
  });

  it('resets to 1 on first activity after a gap', () => {
    expect(calculateNextStreak(4, '2026-01-08T10:00:00Z', '2026-01-11T09:00:00Z')).toBe(1);
  });
});

describe('streak activity triggers', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await initializeEventSystem();
  });

  it('updates the streak when a lesson is completed successfully', async () => {
    const updateSpy = vi.spyOn(db, 'updateUserStreak').mockResolvedValue({ streak: 1 } as any);

    await defaultPublisher.publish(makeEvent({
      name: 'LessonCompleted',
      version: 1,
      source: 'test',
      userId: 'user-1',
      payload: { sessionId: 'session-1', completedAt: '2026-01-10T10:00:00Z' },
    }) as any);

    expect(updateSpy).toHaveBeenCalledWith('user-1', '2026-01-10T10:00:00Z');
  });

  it('updates the streak when an exercise is validated successfully', async () => {
    const updateSpy = vi.spyOn(db, 'updateUserStreak').mockResolvedValue({ streak: 1 } as any);

    // Ensure the exercise can be loaded by the progress subscriber
    vi.spyOn(db, 'getExercise').mockResolvedValue({ id: 12, module_id: 5 } as any);

    await defaultPublisher.publish(makeEvent({
      name: 'ExerciseValidated',
      version: 1,
      source: 'test',
      userId: 'user-1',
      payload: { exerciseId: 12, xp: 50, passed: true },
    }) as any);

    expect(updateSpy).toHaveBeenCalledWith('user-1', expect.any(String));
  });

  it('keeps the streak unchanged for multiple same-day successful activities', () => {
    const firstDay = '2026-01-10T10:00:00Z';
    const secondActivityLaterSameDay = '2026-01-10T18:30:00Z';

    expect(db.calculateNextStreak(1, firstDay, secondActivityLaterSameDay)).toBe(1);
  });
});
