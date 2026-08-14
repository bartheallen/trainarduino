import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/events/bootstrap', async () => {
  const actual = await vi.importActual<typeof import('@/lib/events/bootstrap')>('@/lib/events/bootstrap');
  return {
    ...actual,
    initializeEventSystem: actual.initializeEventSystem,
  };
});

import { makeEvent } from '@/lib/events/utils';
import { defaultPublisher } from '@/lib/events/publisher';
import { initializeEventSystem } from '@/lib/events/bootstrap';

// Import subscriber so it registers its handler on the global event bus
import '@/lib/events/subscribers/gamificationSubscriber';

describe('gamificationSubscriber', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    await initializeEventSystem();
  });

  it('publishes XpAwarded when ProgressUpdated contains xp > 0', async () => {
    const publishSpy = vi.spyOn(defaultPublisher, 'publish');

    const event = makeEvent({
      name: 'ProgressUpdated',
      version: 1,
      source: 'test',
      userId: 'user-1',
      payload: { xp: 25 },
    });

    await defaultPublisher.publish(event as any);

    expect(publishSpy.mock.calls.some((call) => call[0]?.name === 'XpAwarded')).toBe(true);
  });

  it('does not publish XpAwarded when ProgressUpdated xp is zero', async () => {
    const publishSpy = vi.spyOn(defaultPublisher, 'publish');

    const event = makeEvent({
      name: 'ProgressUpdated',
      version: 1,
      source: 'test',
      userId: 'user-1',
      payload: { xp: 0 },
    });

    await defaultPublisher.publish(event as any);

    expect(publishSpy.mock.calls.some((call) => call[0]?.name === 'XpAwarded')).toBe(false);
  });
});
