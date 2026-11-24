import { balance } from '../../data/balance';
import { SCHEMA_VERSION, type ContentMode } from '../../platform/schema';
import { DEFAULT_CONTENT_MODE } from './systems/contentMode';

/** Fixed simulation step. A long gap, pause, or hidden tab must not fast-forward the clock. */
export const SIM_STEP_MS = 1000 / 60;

export const LEVEL_ID = 'level-1';

export interface GrassPatch {
  id: number;
  x: number;
  y: number;
  growthMs: number;
}

export interface Chicken {
  id: number;
  x: number;
  y: number;
  hungerMs: number;
  eggMs: number;
  moveMs: number;
}

export interface GroundItem {
  id: number;
  x: number;
  y: number;
  kind: 'egg' | 'cage';
}

export interface Bear {
  x: number;
  y: number;
  taps: number;
  ageMs: number;
  spoilMs: number;
  moveMs: number;
}

export interface Truck {
  phase: 'idle' | 'away';
  eggs: number;
  cages: number;
  returnMs: number;
}

export type LevelStatus = 'playing' | 'won' | 'lost';

export interface LevelState {
  schemaVersion: number;
  levelId: string;
  contentMode: ContentMode;
  rng: number;
  money: number;
  elapsedMs: number;
  paused: boolean;
  status: LevelStatus;
  cols: number;
  rows: number;
  grass: GrassPatch[];
  chickens: Chicken[];
  items: GroundItem[];
  warehouseEggs: number;
  warehouseCages: number;
  truck: Truck;
  bear: Bear | null;
  nextBearMs: number;
  soldEggs: number;
  nextId: number;
}

export function createLevelState(contentMode: ContentMode = DEFAULT_CONTENT_MODE): LevelState {
  return {
    schemaVersion: SCHEMA_VERSION,
    levelId: LEVEL_ID,
    contentMode,
    rng: 0x1a2b3c4d,
    money: balance.startingMoney,
    elapsedMs: 0,
    paused: false,
    status: 'playing',
    cols: balance.gridCols,
    rows: balance.gridRows,
    grass: [],
    chickens: [
      {
        id: 1,
        x: 2,
        y: 2,
        hungerMs: 0,
        eggMs: 0,
        moveMs: 0,
      },
    ],
    items: [],
    warehouseEggs: 0,
    warehouseCages: 0,
    truck: { phase: 'idle', eggs: 0, cages: 0, returnMs: 0 },
    bear: null,
    nextBearMs: balance.bearFirstMs,
    soldEggs: 0,
    nextId: 2,
  };
}

export interface ActionResult {
  state: LevelState;
  notice?: string;
}

export function inBounds(state: LevelState, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < state.cols && y < state.rows;
}

export function warehouseUsed(state: LevelState): number {
  return state.warehouseEggs + state.warehouseCages;
}

export function truckCargo(truck: Truck): number {
  return truck.eggs + truck.cages;
}
