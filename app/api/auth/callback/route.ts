import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { ensureProfileForUser } from '@/lib/auth';

/**
 * OAuth Callback Handler
 * 
 * Handles the return from Supabase Auth after OAuth provider authentication (Google, GitHub, etc).
 * 
 * Flow:
 * 1. User completes OAuth at provider
 * 2. Provider redirects to Supabase auth endpoint
 * 3. Supabase redirects here with auth code/data
 * 4. We exchange the code for a session
 * 5. Redirect to appropriate destination based on profile state
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (error) {
    console.error('OAuth error:', { error, errorDescription });
    const params = new URLSearchParams();
    params.set('error', error);
    if (errorDescription) params.set('error_description', errorDescription);
    return NextResponse.redirect(new URL(`/login?${params.toString()}`, request.url));
  }

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (e) {
              // ignore
            }
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      // Session established, now check user profile to determine redirect
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const profile = await ensureProfileForUser(supabase, user);

          if (profile) {
            const redirectTo = profile.niveau_actuel == null
              ? '/positioning-test'
              : '/dashboard';
            return NextResponse.redirect(new URL(redirectTo, request.url));
          }
        }
      } catch (e) {
        console.error('Error ensuring profile after OAuth:', e);
      }

      // Fallback if profile creation still fails
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    console.error('Session exchange error:', exchangeError?.message);
  }

  // If no code or error
  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
}
