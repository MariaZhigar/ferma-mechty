import { describe, expect, it } from 'vitest';
import { resumableLevel } from '../src/game/sim/persist';
import { createLevelState } from '../src/game/sim/state';
import {
  defaultProgress,
  defaultSettings,
  parseProgress,
  parseSettings,
  SCHEMA_VERSION,
} from '../src/platform/schema';
import {
  loadSettingsFrom,
  saveSettingsTo,
  type KeyValueStorage,
} from '../src/platform/settingsStorage';

describe('save schema', () => {
  it('starts a new profile in kids mode with the current schema', () => {
    expect(defaultSettings()).toEqual({
      schemaVersion: SCHEMA_VERSION,
      language: 'ru',
      contentMode: 'kids',
      soundEnabled: true,
    });
    expect(defaultProgress().schemaVersion).toBe(SCHEMA_VERSION);
    expect(defaultProgress().activeLevel).toBeNull();
    expect(SCHEMA_VERSION).toBe(3);
  });

  it('migrates a versionless settings blob and keeps kids as the default mode', () => {
    const parsed = parseSettings({ language: 'en', soundEnabled: false });
    expect(parsed).toEqual({
      ok: true,
      migrated: true,
      value: {
        schemaVersion: 3,
        language: 'en',
        contentMode: 'kids',
        soundEnabled: false,
      },
    });
  });

  it('does not replace a newer schema', () => {
    const newer = {
      schemaVersion: 99,
      language: 'en',
      contentMode: 'regular',
      soundEnabled: false,
    };
    expect(parseSettings(newer)).toEqual({ ok: false, error: 'newer-schema' });
    expect(parseProgress({ schemaVersion: 5, bestMedals: { '1': 'gold' } })).toEqual({
      ok: false,
      error: 'newer-schema',
    });

    const storage = memoryStorage({
      'ferma-mechty.settings': JSON.stringify(newer),
    });
    expect(loadSettingsFrom(storage)).toEqual({ ok: false, error: 'newer-schema' });
    expect(storage.snapshot()['ferma-mechty.settings']).toBe(JSON.stringify(newer));
  });

  it('migrates an M0 progress record and keeps the medal', () => {
    const parsed = parseProgress({
      schemaVersion: 1,
      bestMedals: { 'level-1': 'bronze' },
      unlockedAnimals: ['chicken'],
      unlockedBuildings: [],
    });
    expect(parsed).toEqual({
      ok: true,
      migrated: true,
      value: {
        schemaVersion: 3,
        bestMedals: { 'level-1': 'bronze' },
        unlockedAnimals: ['chicken'],
        unlockedBuildings: [],
        activeLevel: null,
      },
    });
  });

  it('drops a schema-2 grid run and keeps medals and settings', () => {
    const progress = parseProgress({
      schemaVersion: 2,
      bestMedals: { 'level-1': 'silver' },
      unlockedAnimals: ['chicken'],
      unlockedBuildings: ['warehouse'],
      activeLevel: {
        levelId: 'level-1',
        state: {
          schemaVersion: 2,
          levelId: 'level-1',
          status: 'playing',
          cols: 6,
          rows: 6,
          grass: [{ id: 1, x: 1, y: 1, growthMs: 0 }],
        },
      },
    });
    expect(progress).toEqual({
      ok: true,
      migrated: true,
      value: {
        schemaVersion: 3,
        bestMedals: { 'level-1': 'silver' },
        unlockedAnimals: ['chicken'],
        unlockedBuildings: ['warehouse'],
        activeLevel: null,
      },
    });
    expect(
      resumableLevel({
        schemaVersion: 2,
        levelId: 'level-1',
        status: 'playing',
        cols: 6,
        rows: 6,
      }),
    ).toBeNull();

    const settings = parseSettings({
      schemaVersion: 2,
      language: 'en',
      contentMode: 'regular',
      soundEnabled: false,
    });
    expect(settings).toEqual({
      ok: true,
      migrated: true,
      value: {
        schemaVersion: 3,
        language: 'en',
        contentMode: 'regular',
        soundEnabled: false,
      },
    });
  });

  it('keeps an unfinished schema-3 run', () => {
    const state = createLevelState();
    const parsed = parseProgress({
      schemaVersion: 3,
      bestMedals: { 'level-1': 'gold' },
      unlockedAnimals: [],
      unlockedBuildings: [],
      activeLevel: { levelId: 'level-1', state },
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.migrated).toBe(false);
    expect(parsed.value.bestMedals).toEqual({ 'level-1': 'gold' });
    expect(resumableLevel(parsed.value.activeLevel?.state)).toMatchObject({
      levelId: 'level-1',
      status: 'playing',
      well: { water: state.well.water },
    });
  });

  it('writes defaults on the first launch and round-trips a language change', () => {
    const storage = memoryStorage();
    const loaded = loadSettingsFrom(storage);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }
    expect(loaded.value.contentMode).toBe('kids');
    saveSettingsTo(storage, { ...loaded.value, language: 'en' });
    const again = loadSettingsFrom(storage);
    expect(again).toMatchObject({
      ok: true,
      migrated: false,
      value: { language: 'en', contentMode: 'kids', schemaVersion: 3 },
    });
  });
});

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & {
  snapshot(): Record<string, string>;
} {
  const data = { ...initial };
  return {
    getItem(key: string): string | null {
      return data[key] ?? null;
    },
    setItem(key: string, value: string): void {
      data[key] = value;
    },
    snapshot(): Record<string, string> {
      return { ...data };
    },
  };
}
