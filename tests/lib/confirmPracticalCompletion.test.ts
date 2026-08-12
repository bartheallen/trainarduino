import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase client used by the server action
vi.mock('../../lib/supabase', () => ({
  createServerSupabaseClient: vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('../../lib/repos/eventRepo', () => ({
  emitEvent: vi.fn().mockResolvedValue(null),
}));
vi.mock('@/lib/repos/eventRepo', () => ({
  emitEvent: vi.fn().mockResolvedValue(null),
}));

import { confirmPracticalCompletionAction } from '../../lib/exerciseServerActions';
import { createServerSupabaseClient } from '../../lib/supabase';
import { emitEvent } from '../../lib/repos/eventRepo';

function makeFakeSupabase({ user, exercise, existingSubmission }: {
  user?: unknown;
  exercise?: { id: number };
  existingSubmission?: { exercise_id: number } | null;
} = {}) {
  const submissions: Record<number, any> = {};
  if (existingSubmission) submissions[existingSubmission.exercise_id] = existingSubmission;

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: (table: string) => {
      return {
        select: () => ({
          eq: (k: string, v: any) => ({
            eq: (nextK: string, nextV: any) => ({
              single: async () => {
                if (table === 'submissions' && k === 'user_id' && nextK === 'exercise_id') {
                  return { data: submissions[nextV] ?? null, error: null };
                }
                return { data: null, error: null };
              },
            }),
            single: async () => {
              if (table === 'exercises' && k === 'id') {
                if (exercise && exercise.id === v) return { data: exercise, error: null };
                return { data: null, error: { message: 'not found' } };
              }
              if (table === 'submissions') {
                // we only support the specific pattern used in the action
                return { data: submissions[v] ?? null, error: null };
              }
              return { data: null, error: null };
            },
          }),
        }),
        upsert: (rows: any[]) => ({
          select: () => ({
            single: async () => {
              const row = rows[0];
              submissions[row.exercise_id] = row;
              return { data: submissions[row.exercise_id], error: null };
            },
          }),
        }),
      };
    },
  };
}

describe('confirmPracticalCompletionAction', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (emitEvent as any).mockResolvedValue(null);
  });

  it('refuse un utilisateur non authentifié', async () => {
    (createServerSupabaseClient as any).mockResolvedValue({ auth: { getUser: async () => ({ data: { user: null } }) } });
    await expect(confirmPracticalCompletionAction(1, 'user-1')).rejects.toThrow('Utilisateur non authentifié');
  });

  it('refuse si user mismatch', async () => {
    (createServerSupabaseClient as any).mockResolvedValue({ auth: { getUser: async () => ({ data: { user: { id: 'other' } } }) } });
    await expect(confirmPracticalCompletionAction(1, 'user-1')).rejects.toThrow('User mismatch');
  });

  it('refuse un exerciseId invalide', async () => {
    const fake = makeFakeSupabase({ user: { id: 'user-1' } });
    (createServerSupabaseClient as any).mockResolvedValue(fake);
    await expect(confirmPracticalCompletionAction(9999, 'user-1')).rejects.toThrow('Exercise 9999 introuvable');
  });

  it('enregistre la confirmation et est idempotente', async () => {
    const exercise = { id: 10, module_id: 5 };
    const fake = makeFakeSupabase({ user: { id: 'user-1' }, exercise, existingSubmission: null });
    (createServerSupabaseClient as any).mockResolvedValue(fake);

    const res = await confirmPracticalCompletionAction(10, 'user-1');
    expect(res.statut).toBe('approved');
    // Call again: idempotent (should return approved without error)
    const res2 = await confirmPracticalCompletionAction(10, 'user-1');
    expect(res2.statut).toBe('approved');
    // emitEvent should have been called at least once (first confirmation)
    expect((emitEvent as any).mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
