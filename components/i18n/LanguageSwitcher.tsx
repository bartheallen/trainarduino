'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setLocaleAction } from '@/lib/i18n/actions';
import { useLocale } from './LocaleProvider';

export function LanguageSwitcher() {
  const router = useRouter();
  const { locale } = useLocale();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (nextLocale: 'fr' | 'en') => {
    startTransition(async () => {
      const result = await setLocaleAction(nextLocale);
      if (result.ok) router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-slate-900/80 p-1" aria-label="Choisir la langue">
      {(['fr', 'en'] as const).map((value) => (
        <button
          key={value}
          type="button"
          lang={value}
          aria-pressed={locale === value}
          disabled={isPending || locale === value}
          onClick={() => switchLocale(value)}
          className={`rounded-full px-2.5 py-1.5 text-xs font-semibold transition ${
            locale === value
              ? 'bg-cyan-400/15 text-cyan-100 ring-1 ring-cyan-400/30'
              : 'text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          {value.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
