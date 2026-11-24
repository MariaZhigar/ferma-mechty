import { balance } from '../../data/balance';
import { SCHEMA_VERSION, type ContentMode } from '../../platform/schema';
import {
  LEVEL_ID,
  type Bear,
  type Chicken,
  type GrassPatch,
  type GroundItem,
  type LevelState,
  type Truck,
} from './state';

/** Restores a playing run. A won, lost, or corrupt snapshot is not continued. */
export function resumableLevel(raw: unknown): LevelState | null {
  const state = parseLevelState(raw);
  if (!state || state.status !== 'playing') {
    return null;
  }
  return { ...state, paused: false };
}

export function parseLevelState(raw: unknown): LevelState | null {
  if (!isRecord(raw) || raw.levelId !== LEVEL_ID) {
    return null;
  }
  if (raw.cols !== balance.gridCols || raw.rows !== balance.gridRows) {
    return null;
  }
  const status = raw.status;
  if (status !== 'playing' && status !== 'won' && status !== 'lost') {
    return null;
  }
  const contentMode: ContentMode = raw.contentMode === 'regular' ? 'regular' : 'kids';
  return {
    schemaVersion: SCHEMA_VERSION,
    levelId: LEVEL_ID,
    contentMode,
    rng: num(raw.rng, 1),
    money: num(raw.money, 0),
    elapsedMs: num(raw.elapsedMs, 0),
    paused: false,
    status,
    cols: balance.gridCols,
    rows: balance.gridRows,
    grass: readGrass(raw.grass),
    chickens: readChickens(raw.chickens),
    items: readItems(raw.items),
    warehouseEggs: num(raw.warehouseEggs, 0),
    warehouseCages: num(raw.warehouseCages, 0),
    truck: readTruck(raw.truck),
    bear: readBear(raw.bear),
    nextBearMs: num(raw.nextBearMs, balance.bearFirstMs),
    soldEggs: num(raw.soldEggs, 0),
    nextId: Math.max(1, num(raw.nextId, 1)),
  };
}

function readGrass(value: unknown): GrassPatch[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }
    return [
      {
        id: num(entry.id, 0),
        x: num(entry.x, 0),
        y: num(entry.y, 0),
        growthMs: num(entry.growthMs, 0),
      },
    ];
  });
}

function readChickens(value: unknown): Chicken[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }
    return [
      {
        id: num(entry.id, 0),
        x: num(entry.x, 0),
        y: num(entry.y, 0),
        hungerMs: num(entry.hungerMs, 0),
        eggMs: num(entry.eggMs, 0),
        moveMs: num(entry.moveMs, 0),
      },
    ];
  });
}

function readItems(value: unknown): GroundItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => {
    if (!isRecord(entry) || (entry.kind !== 'egg' && entry.kind !== 'cage')) {
      return [];
    }
    return [{ id: num(entry.id, 0), x: num(entry.x, 0), y: num(entry.y, 0), kind: entry.kind }];
  });
}

function readTruck(value: unknown): Truck {
  if (!isRecord(value)) {
    return { phase: 'idle', eggs: 0, cages: 0, returnMs: 0 };
  }
  return {
    phase: value.phase === 'away' ? 'away' : 'idle',
    eggs: num(value.eggs, 0),
    cages: num(value.cages, 0),
    returnMs: num(value.returnMs, 0),
  };
}

function readBear(value: unknown): Bear | null {
  if (!isRecord(value)) {
    return null;
  }
  return {
    x: num(value.x, 0),
    y: num(value.y, 0),
    taps: num(value.taps, 0),
    ageMs: num(value.ageMs, 0),
    spoilMs: num(value.spoilMs, 0),
    moveMs: num(value.moveMs, 0),
  };
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
