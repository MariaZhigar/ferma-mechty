import { balance } from '../../../data/balance';
import { nextRand } from '../rng';
import type { Chicken, GrassPatch, GroundItem, LevelState } from '../state';

interface Spot {
  x: number;
  y: number;
}

export function tickChickens(state: LevelState, dt: number): LevelState {
  let rng = state.rng;
  const rand = (): number => {
    const next = nextRand(rng);
    rng = next.seed;
    return next.value;
  };
  let grass = state.grass;
  let items = state.items;
  let nextId = state.nextId;
  const chickens: Chicken[] = [];
  const panicking = state.bear !== null;

  for (const chicken of state.chickens) {
    let current: Chicken = { ...chicken, moveMs: chicken.moveMs + dt };
    let eaten = false;
    if (current.moveMs >= balance.chickenMoveMs) {
      current.moveMs -= balance.chickenMoveMs;
      const dest =
        panicking && state.bear
          ? stepAway(current, state.bear, state.cols, state.rows, rand)
          : stepTowardFood(current, grass, state.cols, state.rows, rand);
      current = { ...current, x: dest.x, y: dest.y };
    }
    if (!panicking) {
      const readyIndex = grass.findIndex(
        (patch) =>
          patch.x === current.x && patch.y === current.y && patch.growthMs >= balance.grassGrowMs,
      );
      if (readyIndex >= 0) {
        grass = grass.filter((_, index) => index !== readyIndex);
        current = { ...current, hungerMs: 0 };
        eaten = true;
      }
    }
    if (!eaten) {
      current = { ...current, hungerMs: current.hungerMs + dt };
    }
    if (current.hungerMs >= balance.hungerDeathMs) {
      continue;
    }
    if (!panicking && current.hungerMs < balance.hungerStarveMs) {
      current = { ...current, eggMs: current.eggMs + dt };
      if (current.eggMs >= balance.eggIntervalMs) {
        const spot = findEggSpot(current, items, state.cols, state.rows);
        if (spot) {
          items = [...items, { id: nextId, x: spot.x, y: spot.y, kind: 'egg' }];
          nextId += 1;
          current = { ...current, eggMs: 0 };
        }
      }
    }
    chickens.push(current);
  }

  return { ...state, rng, grass, items, chickens, nextId };
}

function stepTowardFood(
  chicken: Chicken,
  grass: readonly GrassPatch[],
  cols: number,
  rows: number,
  rand: () => number,
): Spot {
  const ready = grass.filter((patch) => patch.growthMs >= balance.grassGrowMs);
  const target = nearest(chicken, ready);
  if (!target) {
    return randomStep(chicken, cols, rows, rand);
  }
  return stepToward(chicken, target, cols, rows);
}

function stepAway(
  chicken: Chicken,
  bear: Spot,
  cols: number,
  rows: number,
  rand: () => number,
): Spot {
  const options = neighbors(chicken, cols, rows);
  let best: Spot = chicken;
  let bestDistance = distance(chicken, bear);
  for (const option of options) {
    const away = distance(option, bear);
    if (away > bestDistance) {
      best = option;
      bestDistance = away;
    }
  }
  if (best.x === chicken.x && best.y === chicken.y) {
    return randomStep(chicken, cols, rows, rand);
  }
  return best;
}

function findEggSpot(
  chicken: Chicken,
  items: readonly GroundItem[],
  cols: number,
  rows: number,
): Spot | null {
  const spots = [chicken, ...neighbors(chicken, cols, rows)];
  return (
    spots.find((spot) => !items.some((item) => item.x === spot.x && item.y === spot.y)) ?? null
  );
}

function nearest(origin: Spot, spots: readonly Spot[]): Spot | null {
  let best: Spot | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const spot of spots) {
    const away = distance(origin, spot);
    if (away < bestDistance) {
      best = spot;
      bestDistance = away;
    }
  }
  return best;
}

function stepToward(from: Spot, to: Spot, cols: number, rows: number): Spot {
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  const next =
    Math.abs(to.x - from.x) >= Math.abs(to.y - from.y)
      ? { x: from.x + dx, y: from.y }
      : { x: from.x, y: from.y + dy };
  return next.x >= 0 && next.y >= 0 && next.x < cols && next.y < rows ? next : from;
}

function randomStep(origin: Spot, cols: number, rows: number, rand: () => number): Spot {
  const options = neighbors(origin, cols, rows);
  if (options.length === 0) {
    return origin;
  }
  const index = Math.min(options.length - 1, Math.floor(rand() * options.length));
  return options[index] ?? origin;
}

function neighbors(origin: Spot, cols: number, rows: number): Spot[] {
  const spots: Spot[] = [];
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const) {
    const x = origin.x + dx;
    const y = origin.y + dy;
    if (x >= 0 && y >= 0 && x < cols && y < rows) {
      spots.push({ x, y });
    }
  }
  return spots;
}

function distance(a: Spot, b: Spot): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
