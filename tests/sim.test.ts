import { describe, expect, it } from 'vitest';
import { balance } from '../src/data/balance';
import { applyFieldTap, buyChicken, loadTruck, sendTruck, tapWell } from '../src/game/sim/actions';
import { resumableLevel } from '../src/game/sim/persist';
import {
  createLevelState,
  SIM_STEP_MS,
  warehouseUsed,
  type LevelState,
} from '../src/game/sim/state';
import { stepLevel } from '../src/game/sim/step';
import { medalForWin } from '../src/game/sim/systems/goals';
import { isEggBlinking } from '../src/game/sim/systems/items';
import { tapBear } from '../src/game/sim/systems/predators';

describe('level simulation', () => {
  it('plants a patch anywhere on the meadow and spends one bucket', () => {
    const first = applyFieldTap(createLevelState(), 240, 240);
    expect(first.notice).toBe('notice.grass.planted');
    expect(first.state.grass).toHaveLength(1);
    expect(first.state.grass[0]).toMatchObject({ x: 240, y: 240, growthMs: 0 });
    expect(first.state.well.water).toBe(balance.wellStart - 1);
    const again = applyFieldTap(first.state, 250, 250);
    expect(again.notice).toBe('notice.grass.crowded');
    expect(again.state.grass).toHaveLength(1);
    expect(again.state.well.water).toBe(balance.wellStart - 1);
  });

  it('refuses to plant without water and fills one bucket after a paid delay', () => {
    const dry = { ...createLevelState(), well: { water: 0, filling: false, fillingMs: 0 } };
    expect(applyFieldTap(dry, 300, 300).notice).toBe('notice.well.empty');
    const poor = tapWell(dry);
    expect(poor.notice).toBe('notice.well.poor');
    expect(poor.state.well.water).toBe(0);
    const started = tapWell({ ...dry, money: balance.wellFillCost });
    expect(started.notice).toBe('notice.well.filling');
    expect(started.state.money).toBe(0);
    expect(started.state.well.filling).toBe(true);
    const busy = tapWell(started.state);
    expect(busy.notice).toBe('notice.well.filling');
    expect(busy.state.money).toBe(0);
    const filled = runUntilFilled(started.state);
    expect(filled.well.water).toBe(1);
    expect(filled.well.filling).toBe(false);
    const planted = applyFieldTap(filled, 300, 300);
    expect(planted.state.grass).toHaveLength(1);
    expect(planted.state.well.water).toBe(0);
  });

  it('grows grass and lets a hungry chicken walk over to eat it', () => {
    const start = createLevelState();
    const grown = run(
      {
        ...start,
        chickens: [],
        grass: [{ id: 9, x: 400, y: 400, growthMs: 0 }],
      },
      balance.grassGrowMs + SIM_STEP_MS,
    );
    expect(grown.grass[0]?.growthMs).toBe(balance.grassGrowMs);
    const chicken = start.chickens[0];
    expect(chicken).toBeDefined();
    if (!chicken) {
      return;
    }
    const seeking: LevelState = {
      ...start,
      grass: [{ id: 9, x: chicken.x + 220, y: chicken.y, growthMs: balance.grassGrowMs }],
      chickens: [{ ...chicken, hungerMs: balance.seekFoodMs, wanderMs: 0 }],
    };
    const eaten = run(seeking, 2500);
    expect(eaten.grass).toHaveLength(0);
    expect(eaten.chickens).toHaveLength(1);
  });

  it('starves a chicken that never finds grass', () => {
    const dead = run(createLevelState(), balance.hungerDeathMs + SIM_STEP_MS);
    expect(dead.chickens).toHaveLength(0);
  });

  it('drops an egg after the chicken has eaten recently', () => {
    const start = createLevelState();
    const chicken = start.chickens[0];
    expect(chicken).toBeDefined();
    if (!chicken) {
      return;
    }
    const ready: LevelState = {
      ...start,
      chickens: [
        { ...chicken, eggMs: balance.eggIntervalMs - SIM_STEP_MS, hungerMs: 0, wanderMs: 0 },
      ],
    };
    const laid = stepLevel(ready, SIM_STEP_MS);
    expect(laid.items.some((item) => item.kind === 'egg')).toBe(true);
  });

  it('blinks an egg and then removes it if nobody picks it up', () => {
    const start = createLevelState();
    const aging: LevelState = {
      ...start,
      chickens: [],
      items: [
        {
          id: 4,
          x: 400,
          y: 400,
          kind: 'egg',
          ageMs: balance.eggLifeMs - balance.eggBlinkMs - SIM_STEP_MS,
        },
      ],
    };
    const blinking = stepLevel(aging, SIM_STEP_MS);
    expect(blinking.items).toHaveLength(1);
    expect(isEggBlinking(blinking.items[0]?.ageMs ?? 0)).toBe(true);
    const gone = run(blinking, balance.eggBlinkMs + SIM_STEP_MS * 2);
    expect(gone.items).toHaveLength(0);
  });

  it('leaves an egg on the ground when the warehouse is full', () => {
    const start = createLevelState();
    const full: LevelState = {
      ...start,
      warehouseEggs: balance.warehouseCapacity,
      items: [{ id: 4, x: 400, y: 400, kind: 'egg', ageMs: 0 }],
    };
    const result = applyFieldTap(full, 400, 400);
    expect(result.notice).toBe('notice.warehouse.full');
    expect(result.state.items).toHaveLength(1);
  });

  it('pays for eggs only after the truck returns', () => {
    const loaded = loadTruck({ ...createLevelState(), warehouseEggs: 2 }).state;
    expect(loaded.truck.eggs).toBe(2);
    expect(loaded.warehouseEggs).toBe(0);
    const sent = sendTruck(loaded).state;
    expect(sent.truck.phase).toBe('away');
    expect(sent.money).toBe(0);
    const paid = run(sent, balance.truckTripMs + SIM_STEP_MS);
    expect(paid.truck.phase).toBe('idle');
    expect(paid.soldEggs).toBe(2);
    expect(paid.money).toBe(2 * balance.eggPrice);
  });

  it('stores a cage in several slots and sells it with the truck', () => {
    const caught = cagedBear();
    const cage = caught.items.find((item) => item.kind === 'cage');
    expect(cage).toBeDefined();
    if (!cage) {
      return;
    }
    const tight: LevelState = {
      ...caught,
      warehouseEggs: balance.warehouseCapacity - balance.cageSlots + 1,
    };
    const blocked = applyFieldTap(tight, cage.x, cage.y);
    expect(blocked.notice).toBe('notice.cage.slots');
    expect(blocked.state.items.some((item) => item.kind === 'cage')).toBe(true);
    const stored = applyFieldTap({ ...caught, warehouseEggs: 1 }, cage.x, cage.y);
    expect(stored.notice).toBe('notice.cage.collected');
    expect(warehouseUsed(stored.state)).toBe(1 + balance.cageSlots);
    const loaded = loadTruck(stored.state).state;
    expect(loaded.truck.cages).toBe(1);
    expect(loaded.truck.eggs).toBe(1);
    expect(loaded.warehouseCages).toBe(0);
    const paid = run(sendTruck(loaded).state, balance.truckTripMs + SIM_STEP_MS);
    expect(paid.money).toBe(balance.eggPrice + balance.cagePrice);
  });

  it('lets a caged bear break out when the cage is left on the ground', () => {
    const caught = cagedBear();
    expect(caught.bear).toBeNull();
    const loose = run(caught, balance.cageEscapeMs + SIM_STEP_MS * 2);
    expect(loose.items.some((item) => item.kind === 'cage')).toBe(false);
    expect(loose.bear).not.toBeNull();
    expect(loose.bear?.taps).toBe(0);
  });

  it('wins when enough eggs have been sold and loses when the clock runs out', () => {
    const almost = {
      ...createLevelState(),
      soldEggs: balance.goalSoldEggs - 1,
      warehouseEggs: 1,
    };
    const won = run(sendTruck(loadTruck(almost).state).state, balance.truckTripMs + SIM_STEP_MS);
    expect(won.status).toBe('won');
    const lost = run(createLevelState(), balance.levelTimeMs + SIM_STEP_MS);
    expect(lost.status).toBe('lost');
  });

  it('does not advance a paused level or catch up a long gap', () => {
    const start = createLevelState();
    expect(stepLevel({ ...start, paused: true }, 10_000).elapsedMs).toBe(0);
    expect(stepLevel(start, 10_000).elapsedMs).toBe(SIM_STEP_MS);
  });

  it('cages a bear after the tap series and resumes that run from a save', () => {
    const caught = cagedBear();
    const restored = resumableLevel(JSON.parse(JSON.stringify(caught)) as unknown);
    expect(restored?.items.some((item) => item.kind === 'cage')).toBe(true);
    expect(resumableLevel({ ...caught, status: 'won' })).toBeNull();
    expect(
      resumableLevel({
        schemaVersion: 2,
        levelId: 'level-1',
        status: 'playing',
        cols: 6,
        rows: 6,
      }),
    ).toBeNull();
  });

  it('buys a chicken only when the player can afford one', () => {
    const poor = buyChicken(createLevelState());
    expect(poor.notice).toBe('notice.chicken.poor');
    const bought = buyChicken({ ...createLevelState(), money: balance.chickenPrice });
    expect(bought.state.chickens).toHaveLength(2);
    expect(bought.state.money).toBe(0);
  });

  it('awards a faster clear a better medal', () => {
    expect(medalForWin(balance.levelTimeMs - balance.medalGoldRemainingMs)).toBe('gold');
    expect(medalForWin(balance.levelTimeMs - balance.medalSilverRemainingMs)).toBe('silver');
    expect(medalForWin(balance.levelTimeMs - 1000)).toBe('bronze');
  });

  it('can gather a goal of eggs from the starting water', () => {
    let state = createLevelState();
    const hen = state.chickens[0];
    expect(hen).toBeDefined();
    if (!hen) {
      return;
    }
    const spots = [
      [hen.x, hen.y],
      [hen.x + 200, hen.y],
      [hen.x - 200, hen.y],
      [hen.x, hen.y + 200],
      [hen.x, hen.y - 200],
    ];
    for (const [x, y] of spots) {
      const planted = applyFieldTap(state, x ?? 0, y ?? 0);
      expect(planted.notice).toBe('notice.grass.planted');
      state = planted.state;
    }
    state = { ...state, nextBearMs: balance.levelTimeMs };
    let guard = 0;
    while (state.warehouseEggs < balance.goalSoldEggs && guard < 45000) {
      state = stepLevel(state, SIM_STEP_MS);
      const egg = state.items.find((item) => item.kind === 'egg');
      if (egg) {
        state = applyFieldTap(state, egg.x, egg.y).state;
      }
      guard += SIM_STEP_MS;
    }
    expect(state.warehouseEggs).toBeGreaterThanOrEqual(balance.goalSoldEggs);
  });
});

function cagedBear(): LevelState {
  let state: LevelState = { ...createLevelState(), nextBearMs: 0, chickens: [] };
  state = stepLevel(state, SIM_STEP_MS);
  expect(state.bear).not.toBeNull();
  for (let tap = 0; tap < balance.bearTaps; tap += 1) {
    state = tapBear(state).state;
  }
  return state;
}

function runUntilFilled(state: LevelState): LevelState {
  let current = state;
  let guard = 0;
  while (current.well.filling && guard < balance.wellFillMs + 1000) {
    current = stepLevel(current, SIM_STEP_MS);
    guard += SIM_STEP_MS;
  }
  return current;
}

function run(state: LevelState, ms: number): LevelState {
  let current = state;
  let left = ms;
  while (left > 0) {
    current = stepLevel(current, SIM_STEP_MS);
    left -= SIM_STEP_MS;
  }
  return current;
}
