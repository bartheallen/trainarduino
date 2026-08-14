import { describe, it, expect } from 'vitest';

const env = {
  NEXT_PUBLIC_SUPABASE_URL: 'http://localhost',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon_key',
};

describe('SubscriberRegistration', () => {
  it('registers subscribers for a set of event streams', async () => {
    Object.assign(process.env, env);
    const [{ initializeEventSystem }, { defaultEventBus }] = await Promise.all([
      import('@/lib/events/bootstrap'),
      import('@/lib/events/eventBus'),
    ]);

    await initializeEventSystem();

    expect(defaultEventBus.listSubscribers('KnowledgeUpdated').length).toBeGreaterThan(0);
    expect(defaultEventBus.listSubscribers('ExerciseSubmitted').length).toBeGreaterThan(0);
    expect(defaultEventBus.listSubscribers('XpAwarded').length).toBeGreaterThan(0);
  }, 20000);
});
