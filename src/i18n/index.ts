import type { LocaleId } from '../platform/schema';
import en from './en.json';
import ru from './ru.json';

const dictionaries: Record<LocaleId, Record<string, string>> = { ru, en };

export function translate(locale: LocaleId, key: string): string {
  return lookup(dictionaries, locale, key);
}

export function lookup(
  source: Record<LocaleId, Record<string, string>>,
  locale: LocaleId,
  key: string,
): string {
  const primary = source[locale][key];
  if (typeof primary === 'string' && primary.length > 0) {
    return primary;
  }
  if (locale !== 'ru') {
    const fallback = source.ru[key];
    if (typeof fallback === 'string' && fallback.length > 0) {
      return fallback;
    }
  }
  return key;
}

export function dictionaryKeys(locale: LocaleId): string[] {
  return Object.keys(dictionaries[locale]);
}
