import * as repo from '@/lib/repos/profileRepo';
import { profileUpdateSchema, ProfileUpdate } from '@/lib/validation/profile';
import { DuplicateUsernameError, NotFoundError, UnauthorizedError } from '@/lib/errors/profileErrors';
import { defaultPublisher, makeEvent } from '@/lib/events';

export async function getProfileForUser(userId: string) {
  const profile = await repo.getProfileById(userId);
  if (!profile) throw new NotFoundError();
  return profile;
}

export async function updateProfileForUser(userId: string, actorId: string, payload: ProfileUpdate) {
  // Authorization: user can edit their profile; admin check left for future hook
  if (userId !== actorId) {
    throw new UnauthorizedError();
  }

  const parsed = profileUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    throw parsed.error;
  }

  // If username provided, ensure uniqueness
  if (parsed.data.username) {
    const existing = await repo.getProfileByUsername(parsed.data.username);
    if (existing && existing.id !== userId) {
      throw new DuplicateUsernameError();
    }
  }

  const updated = await repo.updateProfile(userId, parsed.data as any);

  const changes: Record<string, any> = {};
  if (parsed.data.username && parsed.data.username !== undefined) {
    changes.username = parsed.data.username;
    const usernameEvent = makeEvent({
      name: 'UsernameChanged',
      version: 1,
      source: 'profile',
      userId,
      causationId: undefined,
      payload: { username: parsed.data.username },
    });
    await defaultPublisher.publish(usernameEvent);
  }

  if (parsed.data.avatar_url !== undefined) {
    const avatarEvent = makeEvent({
      name: 'AvatarUpdated',
      version: 1,
      source: 'profile',
      userId,
      causationId: undefined,
      payload: { avatar_url: parsed.data.avatar_url },
    });
    await defaultPublisher.publish(avatarEvent);
  }

  const profileEvent = makeEvent({
    name: 'ProfileUpdated',
    version: 1,
    source: 'profile',
    userId,
    payload: { changes: parsed.data },
  });
  await defaultPublisher.publish(profileEvent);

  return updated;
}
