import { describe, it, expect } from 'vitest';
import { createMission, startMission } from '@/lib/services/missionService';

describe('MissionFlow', () => {
  it('creates and starts a mission flow', async () => {
    const mission = await createMission({
      title: 'Blink challenge',
      description: 'Control an LED with a timer',
      difficulty: 2,
      concepts: ['led-basics', 'timers'],
    });

    const progress = await startMission('user-1', mission.id);

    expect(mission.id).toBeTruthy();
    expect(progress).toBeTruthy();
  });
});
