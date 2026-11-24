import { balance } from '../../../data/balance';
import {
  clampToYard,
  distance,
  headingAway,
  headingToward,
  moveHeading,
  moveToward,
  nearest,
} from '../motion';
import { nextRand } from '../rng';
import type { Chicken, LevelState } from '../state';

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
    let current: Chicken = { ...chicken, wanderMs: chicken.wanderMs + dt };
    if (current.wanderMs >= balance.chickenWanderMs) {
      current = { ...current, wanderMs: 0, heading: rand() * Math.PI * 2 };
    }
    const ripe = grass.filter((patch) => patch.growthMs >= balance.grassGrowMs);
    const hungry = current.hungerMs >= balance.seekFoodMs;
    const meal = !panicking && hungry ? nearest(current, ripe) : null;
    if (panicking && state.bear) {
      const fled = moveHeading(
        current,
        headingAway(current, state.bear),
        balance.chickenPanicSpeed,
        dt,
      );
      current = { ...current, x: fled.x, y: fled.y, heading: fled.heading };
    } else if (meal) {
      const walked = moveToward(current, meal, balance.chickenSeekSpeed, dt);
      current = { ...current, x: walked.x, y: walked.y, heading: headingToward(current, meal) };
    } else {
      const walked = moveHeading(current, current.heading, balance.chickenWanderSpeed, dt);
      current = { ...current, x: walked.x, y: walked.y, heading: walked.heading };
    }

    let eaten = false;
    if (!panicking) {
      const readyIndex = grass.findIndex(
        (patch) =>
          patch.growthMs >= balance.grassGrowMs &&
          distance(patch, current) <= balance.chickenEatRadius,
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
        const spot = clampToYard(
          current.x + Math.cos(current.heading) * 36,
          current.y + Math.sin(current.heading) * 36,
        );
        items = [...items, { id: nextId, x: spot.x, y: spot.y, kind: 'egg', ageMs: 0 }];
        nextId += 1;
        current = { ...current, eggMs: 0 };
      }
    }
    chickens.push(current);
  }

  return { ...state, rng, grass, items, chickens, nextId };
}
