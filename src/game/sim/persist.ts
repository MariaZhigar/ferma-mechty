import { balance } from '../../data/balance';
import { SCHEMA_VERSION, type ContentMode } from '../../platform/schema';
import { clampToYard } from './motion';
import {
  LEVEL_ID,
  type Bear,
  type Chicken,
  type GrassPatch,
  type GroundItem,
  type LevelState,
  type Truck,
  type Well,
} from './state';

/** Restores a playing run. A won, lost, grid-era, or corrupt snapshot is not continued. */
export function resumableLevel(raw: unknown): LevelState | null {
  const state = parseLevelState(raw);
  if (!state || state.status !== 'playing') {
    return null;
  }
  return { ...state, paused: false };
}

export function parseLevelState(raw: unknown): LevelState | null {
  if (!isRecord(raw) || raw.levelId !== LEVEL_ID || raw.schemaVersion !== SCHEMA_VERSION) {
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
    rng: Math.max(1, Math.floor(num(raw.rng, 1))),
    money: Math.max(0, num(raw.money, 0)),
    elapsedMs: Math.max(0, num(raw.elapsedMs, 0)),
    paused: false,
    status,
    well: readWell(raw.well),
    grass: readGrass(raw.grass),
    chickens: readChickens(raw.chickens),
    items: readItems(raw.items),
    warehouseEggs: count(raw.warehouseEggs),
    warehouseCages: count(raw.warehouseCages),
    truck: readTruck(raw.truck),
    bear: readBear(raw.bear),
    nextBearMs: num(raw.nextBearMs, balance.bearFirstMs),
    soldEggs: count(raw.soldEggs),
    nextId: Math.max(1, Math.floor(num(raw.nextId, 1))),
  };
}

function readWell(value: unknown): Well {
  if (!isRecord(value)) {
    return { water: balance.wellStart, filling: false, fillingMs: 0 };
  }
  const water = Math.max(0, Math.min(balance.wellCapacity, Math.floor(num(value.water, 0))));
  const filling = value.filling === true && water < balance.wellCapacity;
  return {
    water,
    filling,
    fillingMs: filling ? Math.max(0, num(value.fillingMs, 0)) : 0,
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
    const spot = clampToYard(
      num(entry.x, balance.yardWidth / 2),
      num(entry.y, balance.yardHeight / 2),
    );
    return [
      {
        id: num(entry.id, 0),
        x: spot.x,
        y: spot.y,
        growthMs: Math.max(0, num(entry.growthMs, 0)),
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
    const spot = clampToYard(
      num(entry.x, balance.yardWidth / 2),
      num(entry.y, balance.yardHeight / 2),
    );
    return [
      {
        id: num(entry.id, 0),
        x: spot.x,
        y: spot.y,
        heading: num(entry.heading, 0),
        hungerMs: Math.max(0, num(entry.hungerMs, 0)),
        eggMs: Math.max(0, num(entry.eggMs, 0)),
        wanderMs: Math.max(0, num(entry.wanderMs, 0)),
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
    const spot = clampToYard(
      num(entry.x, balance.yardWidth / 2),
      num(entry.y, balance.yardHeight / 2),
    );
    return [
      {
        id: num(entry.id, 0),
        x: spot.x,
        y: spot.y,
        kind: entry.kind,
        ageMs: Math.max(0, num(entry.ageMs, 0)),
      },
    ];
  });
}

function readTruck(value: unknown): Truck {
  if (!isRecord(value)) {
    return { phase: 'idle', eggs: 0, cages: 0, returnMs: 0 };
  }
  return {
    phase: value.phase === 'away' ? 'away' : 'idle',
    eggs: count(value.eggs),
    cages: count(value.cages),
    returnMs: Math.max(0, num(value.returnMs, 0)),
  };
}

function readBear(value: unknown): Bear | null {
  if (!isRecord(value)) {
    return null;
  }
  const spot = clampToYard(
    num(value.x, balance.yardWidth / 2),
    num(value.y, balance.yardHeight / 2),
  );
  return {
    x: spot.x,
    y: spot.y,
    heading: num(value.heading, 0),
    taps: Math.max(0, Math.floor(num(value.taps, 0))),
    ageMs: Math.max(0, num(value.ageMs, 0)),
    spoilMs: Math.max(0, num(value.spoilMs, 0)),
    wanderMs: Math.max(0, num(value.wanderMs, 0)),
  };
}

function count(value: unknown): number {
  const parsed = num(value, 0);
  return parsed > 0 ? Math.floor(parsed) : 0;
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
