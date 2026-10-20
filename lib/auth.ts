'use server';

import { ZodError } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { defaultPublisher, makeEvent } from '@/lib/events';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config';
import { getDictionary, type Dictionary } from '@/lib/i18n/dictionaries';
import {
  signupSchema,
  signinSchema,
  emailSchema,
  passwordSchema,
} from '@/lib/validation/auth';

function normalizeErrorMessage(
  error: { message: string; code?: string },
  dict: Dictionary
) {
  const codeMessages: Record<string, string> = {
    email_address_invalid: dict.auth.invalidEmail,
    email_exists: dict.auth.emailAlreadyUsed,
    invalid_credentials: dict.auth.invalidCredentials,
    weak_password: dict.auth.passwordTooWeak,
    email_not_confirmed: dict.auth.emailNotConfirmed,
    same_password: dict.auth.passwordSameAsOld,
    session_not_found: dict.auth.sessionMissing,
    auth_session_missing: dict.auth.sessionMissing,
    over_email_send_rate_limit: dict.auth.tooManyAttempts,
    over_request_rate_limit: dict.auth.tooManyAttempts,
  };

  if (error.code && codeMessages[error.code]) {
    if (
      error.code === 'over_email_send_rate_limit' &&
      error.message.includes('For security purposes, you can only request this after')
    ) {
      return dict.auth.securityRateLimit;
    }
    return codeMessages[error.code];
  }

  const { message } = error;
  if (message.includes('Unable to validate email address: invalid format')) {
    return dict.auth.invalidEmail;
  }
  if (message.includes('New password should be different from the old password')) {
    return dict.auth.passwordSameAsOld;
  }
  if (message.includes('Auth session missing')) {
    return dict.auth.sessionMissing;
  }
  if (message.includes('For security purposes, you can only request this after')) {
    return dict.auth.securityRateLimit;
  }
  if (message.includes('Email rate limit exceeded')) {
    return dict.auth.tooManyAttempts;
  }
  if (message.includes('Invalid login credentials')) {
    return dict.auth.invalidCredentials;
  }
  if (message.includes('User already registered')) {
    return dict.auth.emailAlreadyUsed;
  }
  if (message.includes('Password should be at least')) {
    return dict.auth.passwordTooWeak;
  }
  if (message.includes('Email not confirmed')) {
    return dict.auth.emailNotConfirmed;
  }
  console.error('Unhandled Supabase auth error:', { code: error.code, message });
  return dict.auth.errorGeneric;
}

function buildValidationMessage(error: ZodError, dict: Dictionary) {
  const validationMessages: Record<string, string> = {
    'Adresse email invalide.': dict.auth.invalidEmail,
    'Le mot de passe doit contenir au moins 8 caractères.': dict.auth.passwordMinLength,
    'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial.': dict.auth.passwordComplexity,
    'Le pseudo doit contenir au moins 3 caractères.': dict.auth.usernameMinLength,
    'Le pseudo doit contenir au plus 20 caractères.': dict.auth.usernameMaxLength,
    'Le pseudo ne peut contenir que des lettres, chiffres et underscores.': dict.auth.usernameCharacters,
    'Le mot de passe est requis.': dict.auth.passwordRequired,
  };
  return error.issues.map((issue) => validationMessages[issue.message] ?? issue.message).join(' ');
}

function isRedirectError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) {
    return false;
  }

  const message = (err as { message?: string })?.message;
  const digest = (err as { digest?: unknown })?.digest;

  return (
    message === 'NEXT_REDIRECT' ||
    (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT'))
  );
}

export async function signup(formData: FormData, locale: Locale = DEFAULT_LOCALE) {
  const dict = getDictionary(locale);
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const username = String(formData.get('username') || '').trim();

  try {
    signupSchema.parse({ email, password, username });
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: buildValidationMessage(error, dict) };
    }
    return { error: dict.auth.invalidForm };
  }

  const supabase = await createServerSupabaseClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  try {
    console.log('signup attempt', {
      email,
      username,
      siteUrl,
    });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/verify-email`,
        data: {
          username,
        },
      },
    });

    console.log('signup result', {
      email,
      username,
      errorCode: error?.code ?? null,
      errorStatus: error?.status ?? null,
      user: data?.user ?? null,
      session: data?.session ?? null,
    });

    if (error) {
      console.error('Supabase signup error:', { code: error.code, message: error.message });
      return { error: normalizeErrorMessage(error, dict) };
    }

    if (!data.user) {
      console.error('signup missing user', {
        email,
        username,
        data,
      });
      return { error: dict.auth.createAccountError };
    }

    const event = makeEvent({
      name: 'UserRegistered',
      version: 1,
      source: 'auth',
      userId: data.user.id,
      payload: { email, username },
    });
    await defaultPublisher.publish(event);

    revalidatePath('/');
    redirect('/verify-email');
  } catch (err: unknown) {
    if (isRedirectError(err)) {
      throw err;
    }

    console.error('signup error:', err);
    return { error: dict.auth.errorGeneric };
  }
}

export async function signin(formData: FormData, locale: Locale = DEFAULT_LOCALE) {
  const dict = getDictionary(locale);
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  try {
    signinSchema.parse({ email, password });
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: buildValidationMessage(error, dict) };
    }
    return { error: dict.auth.invalidForm };
  }

  const supabase = await createServerSupabaseClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase signin error:', { code: error.code, message: error.message });
      return { error: normalizeErrorMessage(error, dict) };
    }

    if (!data.user) {
      return { error: dict.auth.signinError };
    }

    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      return { error: dict.auth.verifyEmailError };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('niveau_actuel')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      return { error: dict.auth.profileNotInitialized };
    }

    revalidatePath('/');
    redirect(profile?.niveau_actuel == null ? '/positioning-test' : '/dashboard');
  } catch (err: unknown) {
    if (isRedirectError(err)) {
      throw err;
    }

    console.error('signin error:', err);
    return { error: dict.auth.errorGeneric };
  }
}

export async function signout(locale: Locale = DEFAULT_LOCALE) {
  const dict = getDictionary(locale);
  const supabase = await createServerSupabaseClient();

  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('signout error:', error);
    return { error: dict.auth.signoutError };
  }

  revalidatePath('/');
  redirect('/login');
}

export async function buildGoogleProfileIdentity(
  user: { id: string; email?: string | null; user_metadata?: Record<string, any> | null },
  existingUsernames: string[] = []
) {
  const meta = user.user_metadata ?? {};
  const preferredUsername = typeof meta.preferred_username === 'string' ? meta.preferred_username : null;
  const givenName = typeof meta.given_name === 'string' ? meta.given_name : null;
  const familyName = typeof meta.family_name === 'string' ? meta.family_name : null;
  const fullName = typeof meta.full_name === 'string' ? meta.full_name : (typeof meta.name === 'string' ? meta.name : null);
  const fallbackLocalPart = typeof user.email === 'string' && user.email.includes('@') ? user.email.split('@')[0] : null;

  const rawDisplayName =
    meta.full_name ||
    meta.name ||
    meta.username ||
    (givenName && familyName ? `${givenName} ${familyName}` : (givenName || familyName || '')) ||
    fullName ||
    preferredUsername ||
    fallbackLocalPart ||
    'Utilisateur';

  const candidateBase =
    (preferredUsername && String(preferredUsername).trim()) ||
    (givenName && familyName ? `${givenName} ${familyName}` : (givenName || familyName || fullName || meta.name || rawDisplayName || fallbackLocalPart || 'Utilisateur')) ||
    fallbackLocalPart ||
    'Utilisateur';

  const baseName = String(candidateBase)
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .slice(0, 24);

  const seedBase = baseName || `user_${user.id.slice(0, 8)}`;
  const seen = new Set(existingUsernames.map((value) => String(value).trim()).filter(Boolean));
  let username = seedBase;
  let suffix = 2;

  while (seen.has(username)) {
    username = `${seedBase}_${suffix}`;
    suffix += 1;
  }

  const displayName = String(rawDisplayName).trim() || 'Utilisateur';

  return {
    username,
    display_name: displayName,
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
  };
}

export async function getGoogleAuthRedirectUrl(flow: 'signin' | 'signup' = 'signin') {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const url = new URL(`${siteUrl}/api/auth/callback`);
  url.searchParams.set('flow', flow);
  return url.toString();
}

export async function ensureProfileForUser(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  user: { id: string; email?: string | null; user_metadata?: Record<string, any> | null }
) {
  const { data: existingProfile, error: existingProfileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!existingProfileError && existingProfile) {
    return existingProfile;
  }

  const { data: existingUsernamesData } = await supabase
    .from('profiles')
    .select('username');

  const existingUsernames = (existingUsernamesData ?? [])
    .map((entry) => entry.username)
    .filter((value): value is string => typeof value === 'string' && value.length > 0);

  const identity = await buildGoogleProfileIdentity(user, existingUsernames);

  const payload = {
    id: user.id,
    username: identity.username,
    display_name: identity.display_name,
    avatar_url: identity.avatar_url,
    biography: null,
    country: user.user_metadata?.country || null,
    preferred_language: user.user_metadata?.preferred_language || 'fr',
    theme_preference: 'system',
    timezone: user.user_metadata?.timezone || null,
    public_profile: true,
    privacy_settings: {},
    learning_preferences: {},
    notification_preferences: {},
    xp_total: 0,
    niveau_actuel: null,
    module_actuel_id: null,
    achievements: [],
    modules_unlocked: [],
    statistics: {},
    is_admin: false,
  };

  const { data: createdProfile, error: createError } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (createError) {
    console.error('ensureProfileForUser failed', {
      userId: user.id,
      email: user.email,
      message: createError.message,
      code: createError.code,
    });
    return null;
  }

  return createdProfile;
}

export async function getCurrentUser(contextName?: string) {
  const supabase = await createServerSupabaseClient();

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log('getCurrentUser', {
      context: contextName ?? 'unknown',
      sessionExists: !!session,
      userFound: !!user,
      userId: user?.id ?? null,
      sessionError: sessionError?.message ?? null,
      userError: userError?.message ?? null,
    });

    if (userError || !user) {
      return null;
    }

    const profile = await ensureProfileForUser(supabase, user);

    return {
      id: user.id,
      email: user.email,
      emailConfirmedAt: user.email_confirmed_at,
      profile,
    };
  } catch (err) {
    console.error('getCurrentUser error', err);
    return null;
  }
}

export async function resetPassword(email: string, locale: Locale = DEFAULT_LOCALE) {
  const dict = getDictionary(locale);
  try {
    emailSchema.parse({ email });
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: buildValidationMessage(error, dict) };
    }
    return { error: dict.auth.invalidForm };
  }

  const supabase = await createServerSupabaseClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  });

  if (error) {
    console.error('Supabase password reset error:', { code: error.code, message: error.message });
    return { error: normalizeErrorMessage(error, dict) };
  }

  return { success: true };
}

export async function updatePassword(newPassword: string, locale: Locale = DEFAULT_LOCALE) {
  const dict = getDictionary(locale);
  try {
    passwordSchema.parse({ newPassword });
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: buildValidationMessage(error, dict) };
    }
    return { error: dict.auth.invalidForm };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    console.error('Supabase password update error:', { code: error.code, message: error.message });
    return { error: normalizeErrorMessage(error, dict) };
  }

  return { success: true };
}

/**
 * Sign in with Google OAuth
 * 
 * Initiates the OAuth flow with Google provider.
 * User is redirected to Google login, then to /api/auth/callback.
 */
export async function signInWithGoogle(mode: 'signin' | 'signup' = 'signin', locale: Locale = DEFAULT_LOCALE) {
  const dict = getDictionary(locale);
  const supabase = await createServerSupabaseClient();

  try {
    const redirectTo = await getGoogleAuthRedirectUrl(mode);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error('Supabase Google auth error:', { code: error.code, message: error.message });
      return { error: normalizeErrorMessage(error, dict) };
    }

    if (data?.url) {
      redirect(data.url);
    }

    return { error: dict.auth.googleError };
  } catch (err: unknown) {
    if (isRedirectError(err)) {
      throw err;
    }

    console.error('signInWithGoogle error:', err);
    return { error: dict.auth.errorGeneric };
  }
}

/**
 * Sign up with Google OAuth
 * 
 * Initiates the OAuth flow with Google provider for new users.
 * User is redirected to Google login, then to /api/auth/callback.
 * 
 * Note: signInWithOAuth handles both signup and signin with Google.
 * If the user doesn't exist, Supabase creates them automatically.
 */
export async function signUpWithGoogle(locale: Locale = DEFAULT_LOCALE) {
  return signInWithGoogle('signup', locale);
}
