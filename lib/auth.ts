'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const username = formData.get('username') as string;

  if (!email || !password || !username) {
    return { error: 'Email, password, and username are required' };
  }

  let userId: string;

  const supabase = await createServerSupabaseClient();

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: 'Failed to create user' };
    }

    userId = authData.user.id;

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          pseudo: username,
          xp_total: 0,
          niveau_actuel: 1,
          module_actuel_id: null,
          created_at: new Date().toISOString(),
        },
      ]);

    if (profileError) {
      return { error: profileError.message };
    }
  } catch (error) {
    return { error: 'An unexpected error occurred' };
  }

  // redirect() est maintenant HORS du try/catch
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function signin(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const supabase = await createServerSupabaseClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (!data.user) {
      return { error: 'Failed to sign in' };
    }
  } catch (error) {
    return { error: 'An unexpected error occurred' };
  }

  // redirect() est maintenant HORS du try/catch
  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signout() {
  const supabase = await createServerSupabaseClient();

  try {
    await supabase.auth.signOut();
  } catch (error) {
    return { error: 'Failed to sign out' };
  }

  revalidatePath('/', 'layout');
  redirect('/login'); // Note: j'ai aussi corrigé /auth/login en /login
}

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
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
      profile,
    };
  } catch (error) {
    return null;
  }
}