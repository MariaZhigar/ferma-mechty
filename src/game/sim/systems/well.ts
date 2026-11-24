import { balance } from '../../../data/balance';
import type { ActionResult, LevelState } from '../state';

export function tickWell(state: LevelState, dt: number): LevelState {
  if (!state.well.filling) {
    return state;
  }
  const fillingMs = state.well.fillingMs + dt;
  if (fillingMs < balance.wellFillMs) {
    return { ...state, well: { ...state.well, fillingMs } };
  }
  return {
    ...state,
    well: {
      water: Math.min(balance.wellCapacity, state.well.water + 1),
      filling: false,
      fillingMs: 0,
    },
  };
}

/** One tap starts a single bucket. The fee is paid up front; the water arrives after the delay. */
export function tapWell(state: LevelState): ActionResult {
  if (state.status !== 'playing' || state.paused) {
    return { state };
  }
  if (state.well.filling) {
    return { state, notice: 'notice.well.filling' };
  }
  if (state.well.water >= balance.wellCapacity) {
    return { state, notice: 'notice.well.full' };
  }
  if (state.money < balance.wellFillCost) {
    return { state, notice: 'notice.well.poor' };
  }
  return {
    state: {
      ...state,
      money: state.money - balance.wellFillCost,
      well: { water: state.well.water, filling: true, fillingMs: 0 },
    },
    notice: 'notice.well.filling',
  };
}
