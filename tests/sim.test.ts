import { describe, expect, it } from 'vitest';
import { balance } from '../src/data/balance';
import { applyFieldTap, buyChicken, loadTruck, sendTruck } from '../src/game/sim/actions';
import { resumableLevel } from '../src/game/sim/persist';
import { createLevelState, SIM_STEP_MS, type LevelState } from '../src/game/sim/state';
import { stepLevel } from '../src/game/sim/step';
import { medalForWin } from '../src/game/sim/systems/goals';
import { tapBear } from '../src/game/sim/systems/predators';

describe('level simulation', () => {
  it('plants one patch of grass on an empty cell and ignores a second tap', () => {
    const planted = applyFieldTap(createLevelState(), 1, 1).state;
    expect(planted.grass).toHaveLength(1);
    expect(planted.grass[0]).toMatchObject({ x: 1, y: 1, growthMs: 0 });
    expect(applyFieldTap(planted, 1, 1).state.grass).toHaveLength(1);
  });

  it('grows grass until it is ready and lets the chicken eat it', () => {
    const start = createLevelState();
    const grown = run(
      { ...start, chickens: [], grass: [{ id: 9, x: 1, y: 1, growthMs: 0 }] },
      balance.grassGrowMs,
    );
    expect(grown.grass[0]?.growthMs).toBe(balance.grassGrowMs);
    const chicken = start.chickens[0];
    expect(chicken).toBeDefined();
    if (!chicken) {
      return;
    }
    const eaten = stepLevel(
      {
        ...start,
        grass: [{ id: 9, x: chicken.x, y: chicken.y, growthMs: balance.grassGrowMs }],
      },
      SIM_STEP_MS,
    );
    expect(eaten.grass).toHaveLength(0);
    expect(eaten.chickens[0]?.hungerMs).toBe(0);
  });

  it('starves a chicken that never finds grass', () => {
    const dead = run(createLevelState(), balance.hungerDeathMs);
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
        { ...chicken, eggMs: balance.eggIntervalMs - SIM_STEP_MS, hungerMs: 0, moveMs: 0 },
      ],
    };
    const laid = stepLevel(ready, SIM_STEP_MS);
    expect(laid.items.some((item) => item.kind === 'egg')).toBe(true);
  });

  it('leaves an egg on the ground when the warehouse is full', () => {
    const start = createLevelState();
    const full: LevelState = {
      ...start,
      warehouseEggs: balance.warehouseCapacity,
      items: [{ id: 4, x: 0, y: 0, kind: 'egg' }],
    };
    const result = applyFieldTap(full, 0, 0);
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
    const paid = run(sent, balance.truckTripMs);
    expect(paid.truck.phase).toBe('idle');
    expect(paid.soldEggs).toBe(2);
    expect(paid.money).toBe(2 * balance.eggPrice);
  });

  it('wins when enough eggs have been sold and loses when the clock runs out', () => {
    const almost = {
      ...createLevelState(),
      soldEggs: balance.goalSoldEggs - 1,
      warehouseEggs: 1,
    };
    const won = run(sendTruck(loadTruck(almost).state).state, balance.truckTripMs);
    expect(won.status).toBe('won');
    const lost = run(createLevelState(), balance.levelTimeMs);
    expect(lost.status).toBe('lost');
  });

  it('does not advance a paused level or catch up a long gap', () => {
    const start = createLevelState();
    expect(stepLevel({ ...start, paused: true }, 10_000).elapsedMs).toBe(0);
    expect(stepLevel(start, 10_000).elapsedMs).toBe(SIM_STEP_MS);
  });

  it('cages a bear after the tap series and resumes that run from a save', () => {
    let state = { ...createLevelState(), nextBearMs: 0 };
    state = stepLevel(state, SIM_STEP_MS);
    expect(state.bear).not.toBeNull();
    for (let tap = 0; tap < balance.bearTaps; tap += 1) {
      state = tapBear(state).state;
    }
    expect(state.bear).toBeNull();
    expect(state.items.some((item) => item.kind === 'cage')).toBe(true);
    const restored = resumableLevel(JSON.parse(JSON.stringify(state)) as unknown);
    expect(restored?.items.some((item) => item.kind === 'cage')).toBe(true);
    expect(resumableLevel({ ...state, status: 'won' })).toBeNull();
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
});

function run(state: LevelState, ms: number): LevelState {
  let current = state;
  let left = ms;
  while (left > 0) {
    current = stepLevel(current, SIM_STEP_MS);
    left -= SIM_STEP_MS;
  }
  return current;
}
