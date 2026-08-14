'use server';

import { ZodError } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { defaultPublisher, makeEvent } from '@/lib/events';
import {
  signupSchema,
  signinSchema,
  emailSchema,
  passwordSchema,
} from '@/lib/validation/auth';

function normalizeErrorMessage(message: string) {
  if (message.includes('Email rate limit exceeded')) {
    return 'Trop de tentatives. Veuillez réessayer plus tard.';
  }
  if (message.includes('Invalid login credentials')) {
    return 'Identifiants invalides. Veuillez vérifier votre email et votre mot de passe.';
  }
  if (message.includes('User already registered')) {
    return 'Cette adresse email est déjà utilisée.';
  }
  if (message.includes('Password should be at least')) {
    return 'Le mot de passe est trop faible. Utilisez au moins 8 caractères.';
  }
  if (message.includes('Invalid login credentials')) {
    return 'Identifiants invalides. Veuillez vérifier votre email et votre mot de passe.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Veuillez confirmer votre adresse email avant de vous connecter.';
  }
  if (message.includes('Invalid login credentials')) {
    return 'Identifiants invalides. Veuillez vérifier votre email et votre mot de passe.';
  }
  return message;
}

function buildValidationMessage(error: ZodError) {
  return error.issues.map((issue) => issue.message).join(' ');
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

export async function signup(formData: FormData) {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const username = String(formData.get('username') || '').trim();

  try {
    signupSchema.parse({ email, password, username });
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: buildValidationMessage(error) };
    }
    return { error: 'Données de formulaire invalides.' };
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
      errorMessage: error?.message ?? null,
      errorCode: error?.code ?? null,
      errorStatus: error?.status ?? null,
      user: data?.user ?? null,
      session: data?.session ?? null,
    });

    if (error) {
      return { error: normalizeErrorMessage(error.message) };
    }

    if (!data.user) {
      console.error('signup missing user', {
        email,
        username,
        data,
      });
      return { error: 'Impossible de créer le compte pour le moment.' };
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
    const message = (err as { message?: string })?.message ?? String(err);
    return { error: normalizeErrorMessage(message) };
  }
}

export async function signin(formData: FormData) {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  try {
    signinSchema.parse({ email, password });
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: buildValidationMessage(error) };
    }
    return { error: 'Données de formulaire invalides.' };
  }

  const supabase = await createServerSupabaseClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: normalizeErrorMessage(error.message) };
    }

    if (!data.user) {
      return { error: 'Impossible de vous connecter pour le moment.' };
    }

    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      return { error: 'Veuillez vérifier votre adresse email avant de vous connecter.' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('niveau_actuel')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      return { error: 'Votre profil n’a pas encore été initialisé.' };
    }

    revalidatePath('/');
    redirect(profile?.niveau_actuel == null ? '/onboarding/positioning-test' : '/dashboard');
  } catch (err: unknown) {
    if (isRedirectError(err)) {
      throw err;
    }

    console.error('signin error:', err);
    const message = (err as { message?: string })?.message ?? String(err);
    return { error: normalizeErrorMessage(message) };
  }
}

export async function signout() {
  const supabase = await createServerSupabaseClient();

  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('signout error:', error);
    return { error: 'Échec de la déconnexion.' };
  }

  revalidatePath('/');
  redirect('/login');
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

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

export async function resetPassword(email: string) {
  try {
    emailSchema.parse({ email });
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: buildValidationMessage(error) };
    }
    return { error: 'Données de formulaire invalides.' };
  }

  const supabase = await createServerSupabaseClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  });

  if (error) {
    return { error: normalizeErrorMessage(error.message) };
  }

  return { success: true };
}

export async function updatePassword(newPassword: string) {
  try {
    passwordSchema.parse({ newPassword });
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: buildValidationMessage(error) };
    }
    return { error: 'Données de formulaire invalides.' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: normalizeErrorMessage(error.message) };
  }

  return { success: true };
}

/**
 * Sign in with Google OAuth
 * 
 * Initiates the OAuth flow with Google provider.
 * User is redirected to Google login, then to /api/auth/callback.
 */
export async function signInWithGoogle() {
  const supabase = await createServerSupabaseClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/api/auth/callback`,
      },
    });

    if (error) {
      return { error: normalizeErrorMessage(error.message) };
    }

    if (data?.url) {
      redirect(data.url);
    }

    return { error: 'Impossible de se connecter avec Google.' };
  } catch (err: unknown) {
    if (isRedirectError(err)) {
      throw err;
    }

    console.error('signInWithGoogle error:', err);
    const message = (err as { message?: string })?.message ?? String(err);
    return { error: normalizeErrorMessage(message) };
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
export async function signUpWithGoogle() {
  // Use the same OAuth flow as signIn
  // Supabase automatically creates new users during OAuth if they don't exist
  return signInWithGoogle();
}
