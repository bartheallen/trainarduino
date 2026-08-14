import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const pathname = requestUrl.pathname;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl?.trim()) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL. Set it in .env.local to your project URL from Supabase Dashboard → Settings → API (e.g. https://xxxx.supabase.co), then restart the Next.js server.'
    );
  }

  if (!supabaseAnonKey?.trim()) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Set it in .env.local to the anon/public key from Supabase Dashboard → Settings → API, then restart the Next.js server.'
    );
  }

  try {
    const parsed = new URL(supabaseUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('protocol must be http or https');
    }
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL ("${supabaseUrl}"). It must be a valid HTTP or HTTPS URL (e.g. https://xxxx.supabase.co). Check .env.local and restart the Next.js server.`
    );
  }

  // Collect cookies that need to be sent back on the response
  const cookiesToSend: Array<{ name: string; value: string; options?: any }> = [];

  // Provide a cookieStore compatible with @supabase/ssr createServerClient
  const cookieStore = {
    getAll() {
      try {
        return request.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
      } catch {
        return [];
      }
    },
    setAll(cookiesArray: Array<{ name: string; value: string; options?: any }>) {
      try {
        // Collect cookies requested to be set by Supabase (will map to Set-Cookie headers)
        cookiesArray.forEach((c) => cookiesToSend.push(c));
      } catch (e) {
        // ignore
      }
    },
  };

  // Log incoming cookie header and parsed cookies for debugging
  // Avoid logging raw cookies or headers to prevent leaking sensitive session data

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: cookieStore,
  });

  // Prefer getUser to get a fresh user object
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user ?? null;

  console.log('middleware auth check:', { pathname, userFound: !!user, userError: userError?.message ?? null });

  // Protected routes that require authentication
  const isProtectedRoute =
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/modules') ||
    pathname.startsWith('/positioning-test');

  // Public auth routes that should be hidden once signed in
  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password';

  const isPasswordResetRoute = pathname === '/reset-password';

  // Helper to attach any cookies collected to a NextResponse before returning
  function attachCookies(response: NextResponse) {
    try {
      cookiesToSend.forEach((c) => {
        // NextResponse.cookies.set expects name, value, and options
        response.cookies.set(c.name, c.value, c.options || {});
      });
    } catch (e) {
      // ignore
    }
    return response;
  }

  // If trying to access protected route without session, redirect to login
  if (isProtectedRoute && !user) {
    console.log('middleware redirect:', pathname, '-> /login', 'session=', !!user);
    return attachCookies(NextResponse.redirect(new URL('/login', request.url)));
  }

  // Let the password reset page render even if a recovery session is present.
  if (isPasswordResetRoute) {
    console.log('middleware allow password reset:', pathname);
    return attachCookies(NextResponse.next());
  }

  // If already logged in and trying to access public auth pages, redirect to the dashboard
  if (isAuthRoute && user) {
    console.log('middleware redirect:', pathname, '-> /dashboard', 'session=', !!user);
    return attachCookies(NextResponse.redirect(new URL('/dashboard', request.url)));
  }

  console.log('middleware next:', pathname, 'session=', !!user);
  return attachCookies(NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
