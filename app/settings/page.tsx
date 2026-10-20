import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { getServerDictionary } from '@/lib/i18n/server';
import { getCurrentUser } from '@/lib/auth';
import { getProfileForUser } from '@/lib/services/profileService';
import { SettingsForm } from './SettingsForm';

export default async function SettingsPage() {
  const user = await getCurrentUser('settings');
  if (!user) redirect('/login');
  const profile = await getProfileForUser(user.id);
  const dict = await getServerDictionary();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,.12),transparent_30%),#071016] px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-xl">
        <Link href="/dashboard" className="text-sm text-cyan-200">
          {dict.common.backToDashboard}
        </Link>
        <section className="mt-5 rounded-[2rem] border border-white/10 bg-slate-900/80 p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[.28em] text-cyan-300">{dict.settings.preferences}</p>
          <h1 className="mt-2 text-3xl font-semibold">{dict.settings.title}</h1>
          <p className="mt-2 text-sm text-slate-400">{dict.settings.description}</p>

          <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">{dict.settings.language}</p>
                <p className="mt-1 text-xs text-slate-400">{dict.settings.languageNote}</p>
              </div>
              <LanguageSwitcher />
            </div>
          </div>

          <SettingsForm
            profile={{
              username: profile.username,
              display_name: profile.display_name,
            }}
          />
        </section>
      </div>
    </main>
  );
}
