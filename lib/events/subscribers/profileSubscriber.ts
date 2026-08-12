import type { EventEnvelope } from '@/lib/events/types';
import { defaultSubscriber } from '@/lib/events/subscriber';
import { defaultPublisher } from '@/lib/events/publisher';
import { makeEvent } from '@/lib/events/utils';
import * as profileRepo from '@/lib/repos/profileRepo';
import * as db from '@/lib/db';

async function handleUserRegistered(event: EventEnvelope<any>) {
  const userId = event.userId;
  if (!userId) return;

  let existingProfile = null;
  try {
    existingProfile = await profileRepo.getProfileById(userId);
  } catch {
    existingProfile = null;
  }

  const defaultProfile = {
    username: event.payload?.username || event.payload?.email || `user_${String(userId).slice(0, 8)}`,
    display_name: event.payload?.username || event.payload?.email || null,
    avatar_url: null,
    biography: null,
    country: null,
    preferred_language: 'fr',
    theme_preference: 'system',
    timezone: null,
    public_profile: true,
    privacy_settings: {},
    learning_preferences: {},
    notification_preferences: {},
    streak: 0,
    achievements: [],
    modules_unlocked: [],
    statistics: {},
    is_admin: false,
  };

  if (!existingProfile) {
    await profileRepo.upsertProfile(userId, defaultProfile);
  } else {
    const patch: Record<string, any> = {};
    for (const [key, value] of Object.entries(defaultProfile)) {
      if (existingProfile[key as keyof typeof existingProfile] == null) {
        patch[key] = value;
      }
    }
    if (Object.keys(patch).length > 0) {
      await profileRepo.updateProfile(userId, patch);
    }
  }

}

async function handleXpAwarded(event: EventEnvelope<any>) {
  const userId = event.userId;
  const payload = event.payload ?? {};
  if (!userId) return;

  const xp = Number(payload.xp ?? 0);
  if (xp === 0) return;

  // read previous profile
  const prev = await db.getUserProfile(userId).catch(() => null);
  const prevLevel = prev?.niveau_actuel ?? 1;

  // update XP via DB util (idempotent for added XP values)
  const updated = await db.updateUserXP(userId, xp).catch((err) => {
    console.error('[ProfileSubscriber] updateUserXP failed', err);
    return null;
  });
  if (!updated) return;

  await db.updateUserStreak(userId, payload.awardedAt || event.timestamp).catch((err) => {
    console.error('[ProfileSubscriber] updateUserStreak failed', err);
  });

  const nextLevel = updated.niveau_actuel ?? prevLevel;
  if (nextLevel > prevLevel) {
    const eventLvl = makeEvent({ name: 'LevelUp', version: 1, source: 'profile', userId, payload: { newLevel: nextLevel } });
    await defaultPublisher.publish(eventLvl as any);
  }

  const profile = await profileRepo.getProfileById(userId).catch(() => null);
  if (!profile) return;

  const achievements = Array.isArray(profile.achievements) ? [...profile.achievements] : [];
  let changed = false;

  if (payload.lessonCompleted) {
    const badge = 'Lesson Completed';
    if (!achievements.includes(badge)) { achievements.push(badge); changed = true; }
  }
  if (payload.projectCompleted) {
    const badge = 'Project Completed';
    if (!achievements.includes(badge)) { achievements.push(badge); changed = true; }
  }

  if (changed) {
    await profileRepo.updateProfile(userId, { achievements }).catch((err) => console.error('[ProfileSubscriber] updateProfile achievements failed', err));
    const newAchEvent = makeEvent({ name: 'AchievementUnlocked', version: 1, source: 'profile', userId, payload: { achievements } });
    await defaultPublisher.publish(newAchEvent as any);
  }
}

async function handleRecommendationsUpdated(event: EventEnvelope<any>) {
  const userId = event.userId;
  if (!userId) return;

  const profile = await profileRepo.getProfileById(userId).catch(() => null);
  if (!profile) return;
  const achievements = Array.isArray(profile.achievements) ? [...profile.achievements] : [];
  const badge = 'Recommendations Explored';
  if (!achievements.includes(badge)) {
    achievements.push(badge);
    await profileRepo.updateProfile(userId, { achievements }).catch((err) => console.error('[ProfileSubscriber] updateProfile recommendations failed', err));
    const evt = makeEvent({ name: 'AchievementUnlocked', version: 1, source: 'profile', userId, payload: { achievement: badge } });
    await defaultPublisher.publish(evt as any);
  }
}

// Register subscribers
defaultSubscriber.subscribe('UserRegistered', handleUserRegistered);
defaultSubscriber.subscribe('XpAwarded', handleXpAwarded);
defaultSubscriber.subscribe('RecommendationsUpdated', handleRecommendationsUpdated);
