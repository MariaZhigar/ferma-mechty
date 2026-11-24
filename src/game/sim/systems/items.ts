import { balance } from '../../../data/balance';
import { clampToYard } from '../motion';
import type { Bear, LevelState } from '../state';

export function isEggBlinking(ageMs: number): boolean {
  return ageMs >= balance.eggLifeMs - balance.eggBlinkMs && ageMs < balance.eggLifeMs;
}

export function isCageBlinking(ageMs: number): boolean {
  return ageMs >= balance.cageEscapeMs - balance.cageBlinkMs && ageMs < balance.cageEscapeMs;
}

/** Eggs vanish when they sit too long. A cage that nobody picks up lets the bear out. */
export function tickGround(state: LevelState, dt: number): LevelState {
  if (state.items.length === 0) {
    return state;
  }
  let bear = state.bear;
  const items = [];
  for (const item of state.items) {
    const ageMs = item.ageMs + dt;
    if (item.kind === 'egg') {
      if (ageMs < balance.eggLifeMs) {
        items.push({ ...item, ageMs });
      }
      continue;
    }
    if (ageMs < balance.cageEscapeMs) {
      items.push({ ...item, ageMs });
      continue;
    }
    if (!bear) {
      bear = escapedBear(item.x, item.y);
    }
  }
  return { ...state, items, bear };
}

function escapedBear(x: number, y: number): Bear {
  const spot = clampToYard(x, y);
  return {
    x: spot.x,
    y: spot.y,
    heading: Math.PI,
    taps: 0,
    ageMs: 0,
    spoilMs: 0,
    wanderMs: 0,
  };
}
