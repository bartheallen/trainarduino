'use client';

import { createContext, useContext, useMemo } from 'react';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries/fr';

interface LocaleContextValue {
  locale: Locale;
  dict: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, dict }), [dict, locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used inside LocaleProvider');
  }
  return context;
}

export function useDictionary() {
  return useLocale().dict;
}
