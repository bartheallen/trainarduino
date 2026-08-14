'use client';

import { useState } from 'react';
import { signInWithGoogle, signUpWithGoogle } from '@/lib/auth';

interface GoogleAuthButtonProps {
  /** 'signin' or 'signup' - determines button text and action */
  mode: 'signin' | 'signup';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Google OAuth Button Component
 * 
 * Handles OAuth flow with Google provider.
 * Shows loading state and error handling.
 * Responsive and mobile-friendly.
 */
export function GoogleAuthButton({ mode, className = '' }: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsLoading(true);
    setError(null);

    try {
      const action = mode === 'signup' ? signUpWithGoogle : signInWithGoogle;
      const result = await action();

      // If we get here, there was an error (no redirect happened)
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      }
    } catch (err) {
      // Redirect errors are expected and will be caught by the framework
      // Other errors should be shown to user
      if (!isRedirectError(err)) {
        console.error('Google auth error:', err);
        setError('Une erreur est survenue. Veuillez réessayer.');
        setIsLoading(false);
      }
    }
  }

  const buttonText = mode === 'signup' ? 'S\'inscrire avec Google' : 'Continuer avec Google';

  return (
    <div className={className}>
      {error && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2">
          <p className="text-xs text-red-200 sm:text-sm">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 sm:gap-3 sm:px-5"
      >
        {/* Google Icon */}
        <svg
          className="h-5 w-5 sm:h-6 sm:w-6"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>

        <span className="text-sm sm:text-base">
          {isLoading ? (mode === 'signup' ? 'Inscription...' : 'Connexion...') : buttonText}
        </span>
      </button>
    </div>
  );
}

/**
 * Check if error is a Next.js redirect error
 */
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
