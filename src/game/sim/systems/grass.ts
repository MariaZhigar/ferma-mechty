import { balance } from '../../../data/balance';
import { inBounds, type LevelState } from '../state';

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

export function plantGrass(state: LevelState, x: number, y: number): LevelState {
  if (state.status !== 'playing' || state.paused || !inBounds(state, x, y)) {
    return state;
  }
  if (state.grass.some((patch) => patch.x === x && patch.y === y)) {
    return state;
  }
  if (state.items.some((item) => item.x === x && item.y === y)) {
    return state;
  }
  return {
    ...state,
    nextId: state.nextId + 1,
    grass: [...state.grass, { id: state.nextId, x, y, growthMs: 0 }],
  };
}
