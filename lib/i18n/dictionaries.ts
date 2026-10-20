import { DEFAULT_LOCALE, isLocale, type Locale } from './config';
import { en } from './dictionaries/en';
import { fr, type Dictionary } from './dictionaries/fr';

const dictionaries: Record<Locale, Dictionary> = {
  fr,
  en,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[isLocale(locale) ? locale : DEFAULT_LOCALE];
}

export type { Dictionary };