'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';
import { PrimitiveBadge } from '@/components/design/PrimitiveBadge';

interface ProfileEditorProps {
  profile: {
    id: string;
    username: string;
    display_name?: string | null;
    biography?: string | null;
    avatar_url?: string | null;
  };
  action: (formData: FormData) => Promise<void>;
}

export function ProfileEditor({ profile, action }: ProfileEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    try {
      await action(formData);
      setMessage('Profil mis à jour.');
      router.refresh();
    } catch {
      setMessage('La mise à jour a échoué.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PrimitiveCard tone="floating" className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Profil</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Modifier votre profil</h1>
        </div>
        <PrimitiveBadge tone="accent">V1</PrimitiveBadge>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-300">
            <span className="mb-2 block font-medium">Nom d’utilisateur</span>
            <input name="username" defaultValue={profile.username} className="w-full rounded-[1rem] border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400/30" />
          </label>
          <label className="text-sm text-slate-300">
            <span className="mb-2 block font-medium">Nom affiché</span>
            <input name="display_name" defaultValue={profile.display_name ?? ''} className="w-full rounded-[1rem] border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400/30" />
          </label>
        </div>

        <label className="text-sm text-slate-300">
          <span className="mb-2 block font-medium">Biographie</span>
          <textarea name="biography" defaultValue={profile.biography ?? ''} rows={4} className="w-full rounded-[1rem] border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400/30" />
        </label>

        <label className="text-sm text-slate-300">
          <span className="mb-2 block font-medium">Avatar URL</span>
          <input name="avatar_url" defaultValue={profile.avatar_url ?? ''} className="w-full rounded-[1rem] border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400/30" />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className="rounded-full bg-cyan-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <Link href="/profile" className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/25 hover:text-cyan-100">Voir le profil</Link>
        </div>

        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      </form>
    </PrimitiveCard>
  );
}
