import { balance } from '../../../data/balance';
import { distance, inPlantable } from '../motion';
import type { ActionResult, LevelState } from '../state';

export function tickGrass(state: LevelState, dt: number): LevelState {
  if (state.grass.length === 0) {
    return state;
  }
  return {
    ...state,
    grass: state.grass.map((patch) => ({
      ...patch,
      growthMs: Math.min(balance.grassGrowMs, patch.growthMs + dt),
    })),
  };
}

export function plantGrass(state: LevelState, x: number, y: number): ActionResult {
  if (state.status !== 'playing' || state.paused || !inPlantable(x, y)) {
    return { state };
  }
  if (state.well.water < 1) {
    return { state, notice: 'notice.well.empty' };
  }
  if (state.grass.length >= balance.maxGrass) {
    return { state, notice: 'notice.grass.full' };
  }
  const spot = { x, y };
  if (state.grass.some((patch) => distance(patch, spot) < balance.grassSpacing)) {
    return { state, notice: 'notice.grass.crowded' };
  }
  if (state.items.some((item) => distance(item, spot) < balance.plantClearance)) {
    return { state, notice: 'notice.grass.blocked' };
  }
  return {
    state: {
      ...state,
      nextId: state.nextId + 1,
      well: { ...state.well, water: state.well.water - 1 },
      grass: [...state.grass, { id: state.nextId, x, y, growthMs: 0 }],
    },
    notice: 'notice.grass.planted',
  };
}
