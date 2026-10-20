'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';
import { PrimitiveBadge } from '@/components/design/PrimitiveBadge';
import { useDictionary } from '@/components/i18n/LocaleProvider';

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
  const dict = useDictionary();
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
      setMessage(dict.profile.updated);
      router.refresh();
    } catch {
      setMessage(dict.profile.updateFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PrimitiveCard tone="floating" className="p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">{dict.profile.section}</p>
          <h1 className="mt-2 break-words text-2xl font-semibold text-white sm:text-3xl">{dict.profile.editHeading}</h1>
        </div>
        <PrimitiveBadge tone="accent">{dict.profile.versionBadge}</PrimitiveBadge>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-300">
            <span className="mb-2 block font-medium">{dict.profile.usernameLabel}</span>
            <input name="username" defaultValue={profile.username} className="w-full rounded-[1rem] border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400/30" />
          </label>
          <label className="text-sm text-slate-300">
            <span className="mb-2 block font-medium">{dict.profile.displayName}</span>
            <input name="display_name" defaultValue={profile.display_name ?? ''} className="w-full rounded-[1rem] border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400/30" />
          </label>
        </div>

        <label className="text-sm text-slate-300">
          <span className="mb-2 block font-medium">{dict.profile.biography}</span>
          <textarea name="biography" defaultValue={profile.biography ?? ''} rows={4} className="w-full rounded-[1rem] border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400/30" />
        </label>

        <label className="text-sm text-slate-300">
          <span className="mb-2 block font-medium">{dict.profile.avatarUrl}</span>
          <input name="avatar_url" defaultValue={profile.avatar_url ?? ''} className="w-full rounded-[1rem] border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400/30" />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className="rounded-full bg-cyan-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">
            {saving ? dict.profile.saving : dict.profile.save}
          </button>
          <Link href="/profile" className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/25 hover:text-cyan-100">{dict.profile.viewProfile}</Link>
        </div>

        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      </form>
    </PrimitiveCard>
  );
}
