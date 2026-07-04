'use client';

import { motion } from 'framer-motion';
import { useState, type FormEvent } from 'react';
import { signup } from '@/lib/auth';

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(198,121,63,0.16),_transparent_28%),linear-gradient(135deg,_#0A1410_0%,_#111c18_100%)] px-4 py-10 text-slate-100">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-[2rem] border border-copper-500/20 bg-slate-900/70 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur"
      >
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-copper-400">Inscription</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Créer votre atelier</h1>
          <p className="mt-2 text-sm text-slate-400">Commencez votre aventure Arduino et débloquez votre parcours.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              <p>{error}</p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Pseudo</label>
            <input
              type="text"
              name="username"
              required
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition duration-300 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20"
              placeholder="Choisissez un pseudo"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition duration-300 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20"
              placeholder="Entrez votre email"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Mot de passe</label>
            <input
              type="password"
              name="password"
              required
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition duration-300 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20"
              placeholder="Créez un mot de passe"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01 }}
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-copper-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-copper-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Création du compte…' : 'Créer mon compte'}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Vous avez déjà un compte ?{' '}
          <a href="/login" className="font-semibold text-copper-300 transition hover:text-copper-200">
            Se connecter
          </a>
        </p>
      </motion.div>
    </div>
  );
}
