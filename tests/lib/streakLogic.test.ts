import { describe, expect, it } from 'vitest';
import { calculateNextStreak } from '@/lib/db';

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
