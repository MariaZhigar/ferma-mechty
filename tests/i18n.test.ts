import { describe, expect, it } from 'vitest';
import { dictionaryKeys, lookup, translate } from '../src/i18n';
import en from '../src/i18n/en.json';
import ru from '../src/i18n/ru.json';

describe('i18n', () => {
  it('returns the game title in Russian', () => {
    expect(translate('ru', 'menu.title')).toBe('Ферма Мечты');
  });

  it('keeps the proper name and translates the tagline', () => {
    expect(translate('en', 'menu.title')).toBe('Ферма Мечты');
    expect(translate('en', 'menu.tagline')).toBe('Plant, gather and sell');
    expect(translate('en', 'menu.tagline')).not.toBe(translate('ru', 'menu.tagline'));
  });

  it('uses the same keys in both dictionaries', () => {
    expect(dictionaryKeys('en').sort()).toEqual(dictionaryKeys('ru').sort());
    expect(Object.keys(en).sort()).toEqual(Object.keys(ru).sort());
  });

  it('falls back to Russian and then to the key itself', () => {
    const source = {
      ru: { 'menu.title': 'Ферма Мечты', 'menu.only.ru': 'Только русский' },
      en: { 'menu.title': '' },
    };
    expect(lookup(source, 'en', 'menu.title')).toBe('Ферма Мечты');
    expect(lookup(source, 'en', 'menu.only.ru')).toBe('Только русский');
    expect(lookup(source, 'ru', 'missing.key')).toBe('missing.key');
  });
});
