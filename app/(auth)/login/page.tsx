'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signin } from '@/lib/auth';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    const result = await signin(formData);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full min-w-0 max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
      <h1 className="mb-6 break-words text-3xl font-bold text-slate-100">Connexion</h1>
      
      {/* Email/Password Form */}
      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}
        <div>
          <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-slate-200">
            E-mail
          </label>
          <input
            type="email"
            id="login-email"
            name="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2.5 text-slate-100 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
            placeholder="Saisissez votre e-mail"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-slate-200">
            Mot de passe
          </label>
          <input
            type="password"
            id="login-password"
            name="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2.5 text-slate-100 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
            placeholder="Saisissez votre mot de passe"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 py-2.5 font-semibold text-slate-950 shadow-[0_14px_40px_rgba(50,231,255,0.2)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-slate-400">ou</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* Google OAuth Button */}
      <GoogleAuthButton mode="signin" />

      {/* Links */}
      <div className="mt-6 space-y-3">
        <p className="text-center text-sm text-slate-300">
          Vous n&apos;avez pas de compte ?{' '}
          <Link href="/signup" className="font-medium text-cyan-300 hover:underline">
            Créer un compte
          </Link>
        </p>
        <p className="text-center text-sm text-slate-300">
          <Link href="/forgot-password" className="font-medium text-cyan-300 hover:underline">
            Mot de passe oublié ?
          </Link>
        </p>
      </div>
    </div>
  );
}
