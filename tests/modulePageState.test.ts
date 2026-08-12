import { describe, expect, it } from 'vitest';
import { createModulePageErrorState } from '@/lib/modulePageState';

describe('createModulePageErrorState', () => {
  it('returns an authentication error when no user is present', () => {
    const state = createModulePageErrorState({ user: null, id: '7' });

    expect(state).toMatchObject({
      kind: 'auth',
      title: 'Connexion requise',
    });
  });

  it('returns an invalid module error for non-numeric ids', () => {
    const state = createModulePageErrorState({ user: { id: 'user-1' }, id: 'abc' });

    expect(state).toMatchObject({
      kind: 'invalid-id',
      title: 'Module introuvable',
    });
  });

  it('returns a content loading error with context when loading fails', () => {
    const state = createModulePageErrorState({
      user: { id: 'user-1' },
      id: '12',
      moduleId: 12,
      error: new Error('boom'),
    });

    expect(state).toMatchObject({
      kind: 'content-load-failed',
      title: 'Impossible d’ouvrir ce module',
    });
    expect(state?.detail).toContain('12');
  });
});
