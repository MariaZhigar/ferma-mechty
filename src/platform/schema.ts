export const SCHEMA_VERSION = 1;

export type LocaleId = 'ru' | 'en';
export type ContentMode = 'kids' | 'regular';
export type Medal = 'bronze' | 'silver' | 'gold';

export interface Settings {
  schemaVersion: number;
  language: LocaleId;
  contentMode: ContentMode;
  soundEnabled: boolean;
}

export interface CampaignProgress {
  schemaVersion: number;
  bestMedals: Record<string, Medal>;
  unlockedAnimals: string[];
  unlockedBuildings: string[];
}

export type LoadResult<T> =
  { ok: true; value: T; migrated: boolean } | { ok: false; error: 'newer-schema' };

export function defaultSettings(): Settings {
  return {
    schemaVersion: SCHEMA_VERSION,
    language: 'ru',
    contentMode: 'kids',
    soundEnabled: true,
  };
}

export function defaultProgress(): CampaignProgress {
  return {
    schemaVersion: SCHEMA_VERSION,
    bestMedals: {},
    unlockedAnimals: [],
    unlockedBuildings: [],
  };
}

export function parseSettings(raw: unknown): LoadResult<Settings> {
  if (raw == null) {
    return { ok: true, value: defaultSettings(), migrated: false };
  }
  if (!isRecord(raw)) {
    return { ok: true, value: defaultSettings(), migrated: true };
  }
  const version = readVersion(raw);
  if (version > SCHEMA_VERSION) {
    return { ok: false, error: 'newer-schema' };
  }
  const defaults = defaultSettings();
  return {
    ok: true,
    migrated: version < SCHEMA_VERSION,
    value: {
      schemaVersion: SCHEMA_VERSION,
      language: raw.language === 'en' ? 'en' : defaults.language,
      contentMode: raw.contentMode === 'regular' ? 'regular' : 'kids',
      soundEnabled:
        typeof raw.soundEnabled === 'boolean' ? raw.soundEnabled : defaults.soundEnabled,
    },
  };
}

export function parseProgress(raw: unknown): LoadResult<CampaignProgress> {
  if (raw == null) {
    return { ok: true, value: defaultProgress(), migrated: false };
  }
  if (!isRecord(raw)) {
    return { ok: true, value: defaultProgress(), migrated: true };
  }
  const version = readVersion(raw);
  if (version > SCHEMA_VERSION) {
    return { ok: false, error: 'newer-schema' };
  }
  return {
    ok: true,
    migrated: version < SCHEMA_VERSION,
    value: {
      schemaVersion: SCHEMA_VERSION,
      bestMedals: readMedals(raw.bestMedals),
      unlockedAnimals: readStrings(raw.unlockedAnimals),
      unlockedBuildings: readStrings(raw.unlockedBuildings),
    },
  };
}

function readVersion(raw: Record<string, unknown>): number {
  const value = raw.schemaVersion;
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return value;
  }
  return 0;
}

function readMedals(value: unknown): Record<string, Medal> {
  if (!isRecord(value)) {
    return {};
  }
  const medals: Record<string, Medal> = {};
  for (const [id, medal] of Object.entries(value)) {
    if (medal === 'bronze' || medal === 'silver' || medal === 'gold') {
      medals[id] = medal;
    }
  }
  return medals;
}

function readStrings(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
