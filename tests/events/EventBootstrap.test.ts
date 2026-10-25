import { describe, it, expect } from 'vitest';

const env = {
  NEXT_PUBLIC_SUPABASE_URL: 'http://localhost',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon_key',
};

describe('EventBootstrap', () => {
  it('registers every known event name in the event registry', async () => {
    Object.assign(process.env, env);
    const [{ initializeEventSystem }, { defaultEventRegistry }, { KnownEventNames }] = await Promise.all([
      import('@/lib/events/bootstrap'),
      import('@/lib/events/registry'),
      import('@/lib/events/types'),
    ]);

    initializeEventSystem();
    for (const name of KnownEventNames) {
      const registration = defaultEventRegistry.get(name);
      expect(registration).not.toBeNull();
      expect(registration?.name).toBe(name);
    }
  }, 60000);

  it('keeps the bootstrap idempotent when called multiple times', async () => {
    Object.assign(process.env, env);
    const [{ initializeEventSystem }] = await Promise.all([import('@/lib/events/bootstrap')]);

    const first = initializeEventSystem();
    const second = initializeEventSystem();
    expect(first.bus).toBe(second.bus);
    expect(first.registry).toBe(second.registry);
  }, 60000);

  it('does not include unused event names in the known catalog', async () => {
    const { KnownEventNames } = await import('@/lib/events/types');
    expect(KnownEventNames).not.toContain('AIEvaluationCreated');
    expect(KnownEventNames).toContain('KnowledgePredictedToDecay');
  });
});
