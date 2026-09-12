import { describe, it, expect, vi, beforeEach } from 'vitest';

import { makeEvent } from '@/lib/events/utils';
import { defaultPublisher } from '@/lib/events/publisher';

// Import subscribers so they register their handlers on the global event bus
// Order matters: gamificationSubscriber → profileSubscriber
import '@/lib/events/subscribers/gamificationSubscriber';
import '@/lib/events/subscribers/profileSubscriber';

describe('gamificationSubscriber', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    // Mock db functions before subscribers can use them
    const db = await import('@/lib/db');
    const profileRepo = await import('@/lib/repos/profileRepo');
    vi.spyOn(db, 'updateUserXP').mockResolvedValue({ xp_total: 0, niveau_actuel: 1 } as any);
    vi.spyOn(db, 'getUserProfile').mockResolvedValue(null as any);
    vi.spyOn(profileRepo, 'getProfileById').mockResolvedValue(null as any);
    vi.spyOn(profileRepo, 'updateProfile').mockResolvedValue({} as any);
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

  it('calls updateUserXP when XpAwarded is published', async () => {
    const db = await import('@/lib/db');
    const updateXpSpy = vi.spyOn(db, 'updateUserXP');

    const event = makeEvent({
      name: 'ProgressUpdated',
      version: 1,
      source: 'test',
      userId: 'user-1',
      payload: { xp: 25, awardedAt: '2026-01-10T10:00:00Z' },
    });

    await defaultPublisher.publish(event as any);
    
    // Give async handlers time to execute
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(updateXpSpy).toHaveBeenCalledWith('user-1', 25);
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
