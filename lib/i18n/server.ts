import 'server-only';

import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './config';
import { getDictionary, type Dictionary } from './dictionaries';

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return value && isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getServerDictionary(locale?: Locale): Promise<Dictionary> {
  const resolvedLocale = locale ?? (await getLocale());
  return getDictionary(resolvedLocale);
}

export function format(str: string, vars: Record<string, string | number | boolean>): string {
  return str.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = vars[name];
    return value === undefined ? '' : String(value);
  });
}
