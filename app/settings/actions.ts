'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ZodError } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { DuplicateUsernameError } from '@/lib/errors/profileErrors';
import { getServerDictionary } from '@/lib/i18n/server';
import { updateProfileForUser } from '@/lib/services/profileService';

export interface SettingsActionState {
  ok: boolean;
  message: string;
  fieldErrors?: {
    username?: string;
    display_name?: string;
  };
}

export async function saveSettingsAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const user = await getCurrentUser('settings-save');
  if (!user) redirect('/login');

  const dict = await getServerDictionary();

  try {
    await updateProfileForUser(user.id, user.id, {
      username: String(formData.get('username') || '').trim(),
      display_name: String(formData.get('display_name') || '').trim() || undefined,
    });

    revalidatePath('/', 'layout');
    return { ok: true, message: dict.settings.saved };
  } catch (error) {
    if (error instanceof DuplicateUsernameError) {
      return {
        ok: false,
        message: '',
        fieldErrors: { username: dict.settings.usernameTaken },
      };
    }

    if (error instanceof ZodError) {
      const fieldErrors: SettingsActionState['fieldErrors'] = {};
      for (const issue of error.issues) {
        const field = issue.path[0];
        if (field === 'username') {
          fieldErrors.username = dict.settings.usernameLength;
        } else if (field === 'display_name') {
          fieldErrors.display_name = dict.settings.displayNameLength;
        }
      }
      if (Object.keys(fieldErrors).length > 0) {
        return { ok: false, message: '', fieldErrors };
      }
    }

    return { ok: false, message: dict.settings.saveError };
  }
}