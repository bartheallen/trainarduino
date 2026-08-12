import * as repo from '@/lib/repos/missionRepo';
import * as events from '@/lib/repos/eventRepo';
import { missionSchema, missionStepSchema, missionProgressSchema } from '@/lib/validation/learning';

export async function getMission(missionId: string) {
  return repo.getMissionById(missionId);
}

export async function listAllMissions() {
  return repo.listMissions();
}

export async function createMission(payload: unknown) {
  const parsed = missionSchema.parse(payload);
  const mission = await repo.createMission(parsed as any);
  await events.emitEvent(null, 'MissionCreated', { missionId: mission.id });
  return mission;
}

export async function addMissionStep(payload: unknown) {
  const parsed = missionStepSchema.parse(payload);
  const step = await repo.createMissionStep(parsed as any);
  await events.emitEvent(null, 'MissionStepCreated', { missionId: step.mission_id, stepId: step.id });
  return step;
}

export async function startMission(userId: string, missionId: string) {
  const progress = await repo.startMissionProgress(userId, missionId);
  await events.emitEvent(userId, 'MissionStarted', { missionId, progressId: progress.id });
  return progress;
}

export async function getProgress(userId: string, missionId: string) {
  return repo.getMissionProgress(userId, missionId);
}

export async function updateProgress(userId: string, missionId: string, updates: unknown) {
  const parsed = missionProgressSchema.partial().parse(updates);
  const updated = await repo.updateMissionProgress(userId, missionId, parsed as any);
  await events.emitEvent(userId, 'MissionProgressUpdated', { missionId, updates: parsed });
  return updated;
}
