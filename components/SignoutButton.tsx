'use client';

import { signout } from '@/lib/auth';
import { useTransition } from 'react';
import { SignalWaveIcon } from '@/components/ui/ElectronicsIcons';

export function SignoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleSignout = () => {
    startTransition(() => {
      signout();
    });
  };

  return (
    <button
      type="button"
      onClick={handleSignout}
      disabled={isPending}
      aria-label="Se déconnecter"
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50"
    >
      <SignalWaveIcon className="h-4 w-4" />
      {isPending ? 'Déconnexion…' : 'Déconnexion'}
    </button>
  );
}
