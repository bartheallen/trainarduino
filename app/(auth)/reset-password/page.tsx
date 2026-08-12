'use client';

import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { updatePassword } from '@/lib/auth';
import { CircuitChipIcon, LedIndicator, OscilloscopeDivider } from '@/components/ui/ElectronicsIcons';

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password') || '');

    const result = await updatePassword(password);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setIsLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 text-slate-100">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.34)] backdrop-blur-xl sm:p-8"
      >
        <div className="absolute inset-0 bg-[linear-gradient(125deg,transparent_0%,rgba(255,255,255,0.03)_45%,transparent_100%)]" />
        <div className="relative z-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
              <CircuitChipIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Réinitialisation</p>
              <h1 className="mt-1 text-2xl font-semibold text-white">Définissez un nouveau mot de passe</h1>
            </div>
          </div>
          <p className="text-sm text-slate-400">Entrez votre nouveau mot de passe pour finaliser la réinitialisation.</p>
          <OscilloscopeDivider />

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-[1rem] border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
                <p>{error}</p>
              </div>
            )}
            {success && (
              <div className="rounded-[1rem] border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">
                <p>Votre mot de passe a été mis à jour. Vous pouvez vous connecter.</p>
              </div>
            )}

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                <LedIndicator className="shrink-0" />
                Nouveau mot de passe
              </label>
              <input
                type="password"
                name="password"
                required
                className="w-full rounded-[1rem] border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition duration-300 focus:border-cyan-400/30 focus:ring-2 focus:ring-cyan-400/20"
                placeholder="Entrez un nouveau mot de passe"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
