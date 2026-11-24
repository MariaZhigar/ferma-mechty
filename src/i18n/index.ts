import type { LocaleId } from '../platform/schema';
import en from './en.json';
import ru from './ru.json';

const dictionaries: Record<LocaleId, Record<string, string>> = { ru, en };

export function translate(
  locale: LocaleId,
  key: string,
  vars?: Readonly<Record<string, string | number>>,
): string {
  return fill(lookup(dictionaries, locale, key), vars);
}

function fill(text: string, vars?: Readonly<Record<string, string | number>>): string {
  if (!vars) {
    return text;
  }
  let filled = text;
  for (const [name, value] of Object.entries(vars)) {
    filled = filled.replaceAll(`{${name}}`, String(value));
  }
  return filled;
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
