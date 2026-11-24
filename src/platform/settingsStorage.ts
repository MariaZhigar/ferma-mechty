import { parseSettings, SCHEMA_VERSION, type LoadResult, type Settings } from './schema';

export const SETTINGS_KEY = 'ferma-mechty.settings';

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function loadSettingsFrom(storage: KeyValueStorage): LoadResult<Settings> {
  const rawText = storage.getItem(SETTINGS_KEY);
  let raw: unknown = null;
  if (rawText != null) {
    try {
      raw = JSON.parse(rawText) as unknown;
    } catch {
      raw = undefined;
    }
  }
  const parsed = parseSettings(raw);
  if (!parsed.ok) {
    return parsed;
  }
  if (rawText == null || parsed.migrated || raw === undefined) {
    saveSettingsTo(storage, parsed.value);
  }
  return parsed;
}

export function saveSettingsTo(storage: KeyValueStorage, settings: Settings): void {
  const stored: Settings = { ...settings, schemaVersion: SCHEMA_VERSION };
  storage.setItem(SETTINGS_KEY, JSON.stringify(stored));
}

export function loadSettings(): LoadResult<Settings> {
  return loadSettingsFrom(localStorage);
}

export function saveSettings(settings: Settings): void {
  saveSettingsTo(localStorage, settings);
}
