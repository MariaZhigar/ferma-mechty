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
  heading: number;
  hungerMs: number;
  eggMs: number;
  wanderMs: number;
}

export interface GroundItem {
  id: number;
  x: number;
  y: number;
  kind: 'egg' | 'cage';
  ageMs: number;
}

export interface Bear {
  x: number;
  y: number;
  heading: number;
  taps: number;
  ageMs: number;
  spoilMs: number;
  wanderMs: number;
}

export interface Well {
  water: number;
  filling: boolean;
  fillingMs: number;
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
  well: Well;
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
  const chickens: Chicken[] = [];
  for (let index = 0; index < balance.startingChickens; index += 1) {
    chickens.push({
      id: index + 1,
      x: balance.yardWidth * 0.46 + index * 90,
      y: balance.yardHeight * 0.52,
      heading: 0.4,
      hungerMs: 0,
      eggMs: 0,
      wanderMs: 0,
    });
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    levelId: LEVEL_ID,
    contentMode,
    rng: 0x1a2b3c4d,
    money: balance.startingMoney,
    elapsedMs: 0,
    paused: false,
    status: 'playing',
    well: { water: balance.wellStart, filling: false, fillingMs: 0 },
    grass: [],
    chickens,
    items: [],
    warehouseEggs: 0,
    warehouseCages: 0,
    truck: { phase: 'idle', eggs: 0, cages: 0, returnMs: 0 },
    bear: null,
    nextBearMs: balance.bearFirstMs,
    soldEggs: 0,
    nextId: balance.startingChickens + 1,
  };
}

export interface ActionResult {
  state: LevelState;
  notice?: string;
}

export interface TapRadii {
  item: number;
  bear: number;
}

export function warehouseUsed(state: LevelState): number {
  return state.warehouseEggs + state.warehouseCages * balance.cageSlots;
}

export function truckCargo(truck: Truck): number {
  return truck.eggs + truck.cages * balance.cageSlots;
}

export function cageOnGround(state: LevelState): boolean {
  return state.items.some((item) => item.kind === 'cage');
}
