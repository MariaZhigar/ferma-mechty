import { balance } from '../../../data/balance';
import { distance, moveHeading, moveToward, nearest } from '../motion';
import { nextRand } from '../rng';
import type { ActionResult, GroundItem, LevelState } from '../state';
import { cageOnGround } from '../state';

export function tickBear(state: LevelState, dt: number): LevelState {
  let rng = state.rng;
  const rand = (): number => {
    const next = nextRand(rng);
    rng = next.seed;
    return next.value;
  };
  let bear = state.bear;
  let items = state.items;
  if (!bear && !cageOnGround(state) && state.elapsedMs >= state.nextBearMs) {
    const y = balance.yardMargin + rand() * (balance.yardHeight - balance.yardMargin * 2);
    bear = {
      x: balance.yardWidth - balance.yardMargin,
      y,
      heading: Math.PI,
      taps: 0,
      ageMs: 0,
      spoilMs: 0,
      wanderMs: 0,
    };
  }
  if (!bear) {
    return rng === state.rng ? state : { ...state, rng };
  }
  bear = {
    ...bear,
    ageMs: bear.ageMs + dt,
    spoilMs: bear.spoilMs + dt,
    wanderMs: bear.wanderMs + dt,
  };
  const egg = nearest(
    bear,
    items.filter((item) => item.kind === 'egg'),
  );
  if (egg) {
    const walked = moveToward(bear, egg, balance.bearSeekSpeed, dt);
    bear = { ...bear, x: walked.x, y: walked.y };
  } else {
    if (bear.wanderMs >= balance.bearWanderMs) {
      bear = { ...bear, wanderMs: 0, heading: rand() * Math.PI * 2 };
    }
    const walked = moveHeading(bear, bear.heading, balance.bearWanderSpeed, dt);
    bear = { ...bear, x: walked.x, y: walked.y, heading: walked.heading };
  }
  if (bear.spoilMs >= balance.bearSpoilMs) {
    bear = { ...bear, spoilMs: 0 };
    const eggIndex = nearestEggIndex(items, bear);
    if (eggIndex >= 0 && distance(items[eggIndex] ?? bear, bear) <= balance.bearSpoilRadius) {
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
  const bear = state.bear;
  const kept = state.items.filter(
    (item) => item.kind === 'cage' || distance(item, bear) > balance.plantClearance,
  );
  return {
    state: {
      ...state,
      bear: null,
      nextId: state.nextId + 1,
      items: [...kept, { id: state.nextId, x: bear.x, y: bear.y, kind: 'cage', ageMs: 0 }],
    },
    notice: 'notice.bear.caged',
  };
}

function nearestEggIndex(items: readonly GroundItem[], origin: { x: number; y: number }): number {
  let best = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  items.forEach((item, index) => {
    if (item.kind !== 'egg') {
      return;
    }
    const away = distance(item, origin);
    if (away < bestDistance) {
      best = index;
      bestDistance = away;
    }
  });
  return best;
}
