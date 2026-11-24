import { balance } from '../../../data/balance';
import { nextRand } from '../rng';
import type { ActionResult, Bear, GroundItem, LevelState } from '../state';

interface Spot {
  x: number;
  y: number;
}

export function tickBear(state: LevelState, dt: number): LevelState {
  let rng = state.rng;
  const rand = (): number => {
    const next = nextRand(rng);
    rng = next.seed;
    return next.value;
  };
  let bear = state.bear;
  let items = state.items;
  if (!bear && state.elapsedMs >= state.nextBearMs) {
    bear = { x: state.cols - 1, y: 0, taps: 0, ageMs: 0, spoilMs: 0, moveMs: 0 };
  }
  if (!bear) {
    return { ...state, rng };
  }
  bear = {
    ...bear,
    ageMs: bear.ageMs + dt,
    spoilMs: bear.spoilMs + dt,
    moveMs: bear.moveMs + dt,
  };
  if (bear.moveMs >= balance.bearMoveMs) {
    bear = { ...bear, moveMs: bear.moveMs - balance.bearMoveMs };
    const egg = nearestEgg(items, bear);
    const dest = egg
      ? stepToward(bear, egg, state.cols, state.rows)
      : randomStep(bear, state.cols, state.rows, rand);
    bear = { ...bear, x: dest.x, y: dest.y };
  }
  if (bear.spoilMs >= balance.bearSpoilMs) {
    bear = { ...bear, spoilMs: 0 };
    const eggIndex = nearestEggIndex(items, bear);
    if (eggIndex >= 0) {
      items = items.filter((_, index) => index !== eggIndex);
    }
  }
  if (bear.ageMs >= balance.bearLifetimeMs) {
    return {
      ...state,
      rng,
      items,
      bear: null,
      nextBearMs: state.elapsedMs + balance.bearIntervalMs,
    };
  }
  return { ...state, rng, items, bear };
}

export function tapBear(state: LevelState): ActionResult {
  if (!state.bear || state.status !== 'playing' || state.paused) {
    return { state };
  }
  const taps = state.bear.taps + 1;
  if (taps < balance.bearTaps) {
    return { state: { ...state, bear: { ...state.bear, taps } } };
  }
  const withoutEgg = state.items.filter(
    (item) => !(item.x === state.bear?.x && item.y === state.bear.y),
  );
  return {
    state: {
      ...state,
      bear: null,
      nextId: state.nextId + 1,
      nextBearMs: state.elapsedMs + balance.bearIntervalMs,
      items: [...withoutEgg, { id: state.nextId, x: state.bear.x, y: state.bear.y, kind: 'cage' }],
    },
    notice: 'notice.bear.caged',
  };
}

function nearestEgg(items: readonly GroundItem[], origin: Spot): Spot | null {
  const index = nearestEggIndex(items, origin);
  return index >= 0 ? (items[index] ?? null) : null;
}

function nearestEggIndex(items: readonly GroundItem[], origin: Spot): number {
  let best = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  items.forEach((item, index) => {
    if (item.kind !== 'egg') {
      return;
    }
    const away = Math.abs(item.x - origin.x) + Math.abs(item.y - origin.y);
    if (away < bestDistance) {
      best = index;
      bestDistance = away;
    }
  });
  return best;
}

function stepToward(from: Spot, to: Spot, cols: number, rows: number): Spot {
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  const next =
    Math.abs(to.x - from.x) >= Math.abs(to.y - from.y)
      ? { x: from.x + dx, y: from.y }
      : { x: from.x, y: from.y + dy };
  if (next.x < 0 || next.y < 0 || next.x >= cols || next.y >= rows) {
    return from;
  }
  return next;
}

function randomStep(origin: Bear, cols: number, rows: number, rand: () => number): Spot {
  const options: Spot[] = [];
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const) {
    const x = origin.x + dx;
    const y = origin.y + dy;
    if (x >= 0 && y >= 0 && x < cols && y < rows) {
      options.push({ x, y });
    }
  }
  if (options.length === 0) {
    return origin;
  }
  const index = Math.min(options.length - 1, Math.floor(rand() * options.length));
  return options[index] ?? origin;
}
