'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { updateProfileForUser } from '@/lib/services/profileService';
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from './config';

export async function setLocaleAction(locale: string) {
  const nextLocale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, nextLocale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    httpOnly: false,
  });

  const user = await getCurrentUser('set-locale');
  if (user) {
    try {
      await updateProfileForUser(user.id, user.id, { preferred_language: nextLocale });
    } catch {
      // Ignore profile persistence failures so language changes remain available.
    }
  }

  revalidatePath('/', 'layout');
  return { ok: true };
}
