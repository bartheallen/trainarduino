'use client';

import { useState } from 'react';
import { signup } from '@/lib/auth';

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
      <h1 className="mb-6 text-3xl font-bold text-slate-100">Créer un compte</h1>
      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Nom d&apos;utilisateur
          </label>
          <input
            type="text"
            name="username"
            required
            className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2.5 text-slate-100 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
            placeholder="Choisissez un nom d'utilisateur"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            E-mail
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2.5 text-slate-100 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
            placeholder="Saisissez votre e-mail"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Mot de passe
          </label>
          <input
            type="password"
            name="password"
            required
            className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2.5 text-slate-100 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
            placeholder="Créez un mot de passe"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 py-2.5 font-semibold text-slate-950 shadow-[0_14px_40px_rgba(50,231,255,0.2)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Création du compte…' : 'S’inscrire'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-300">
        Vous avez déjà un compte ?{' '}
        <a href="/login" className="font-medium text-cyan-300 hover:underline">
          Se connecter
        </a>
      </p>
    </div>
  );
}
