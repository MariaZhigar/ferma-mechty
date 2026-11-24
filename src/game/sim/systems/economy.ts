import { balance } from '../../../data/balance';
import { distance } from '../motion';
import { nextRand } from '../rng';
import { truckCargo, warehouseUsed, type ActionResult, type LevelState } from '../state';

export function tickTruck(state: LevelState, dt: number): LevelState {
  if (state.truck.phase !== 'away') {
    return state;
  }
  const returnMs = state.truck.returnMs - dt;
  if (returnMs > 0) {
    return { ...state, truck: { ...state.truck, returnMs } };
  }
  return {
    ...state,
    money:
      state.money + state.truck.eggs * balance.eggPrice + state.truck.cages * balance.cagePrice,
    soldEggs: state.soldEggs + state.truck.eggs,
    truck: { phase: 'idle', eggs: 0, cages: 0, returnMs: 0 },
  };
}

export function loadTruck(state: LevelState): ActionResult {
  if (state.status !== 'playing' || state.paused || state.truck.phase !== 'idle') {
    return { state };
  }
  let space = balance.truckCapacity - truckCargo(state.truck);
  const eggs = Math.min(space, state.warehouseEggs);
  space -= eggs;
  const cages = Math.min(state.warehouseCages, Math.floor(space / balance.cageSlots));
  if (eggs + cages === 0) {
    return { state, notice: 'notice.truck.empty' };
  }
  return {
    state: {
      ...state,
      warehouseEggs: state.warehouseEggs - eggs,
      warehouseCages: state.warehouseCages - cages,
      truck: {
        ...state.truck,
        eggs: state.truck.eggs + eggs,
        cages: state.truck.cages + cages,
      },
    },
  };
}

export function sendTruck(state: LevelState): ActionResult {
  if (state.status !== 'playing' || state.paused || state.truck.phase !== 'idle') {
    return { state };
  }
  if (truckCargo(state.truck) === 0) {
    return { state, notice: 'notice.truck.empty' };
  }
  return {
    state: {
      ...state,
      truck: { ...state.truck, phase: 'away', returnMs: balance.truckTripMs },
    },
    notice: 'notice.truck.sent',
  };
}

export function buyChicken(state: LevelState): ActionResult {
  if (state.status !== 'playing' || state.paused) {
    return { state };
  }
  if (state.chickens.length >= balance.maxChickens) {
    return { state, notice: 'notice.chicken.full' };
  }
  if (state.money < balance.chickenPrice) {
    return { state, notice: 'notice.chicken.poor' };
  }
  const spot = findSpawn(state);
  return {
    state: {
      ...state,
      rng: spot.rng,
      money: state.money - balance.chickenPrice,
      nextId: state.nextId + 1,
      chickens: [
        ...state.chickens,
        {
          id: state.nextId,
          x: spot.x,
          y: spot.y,
          heading: spot.heading,
          hungerMs: 0,
          eggMs: 0,
          wanderMs: 0,
        },
      ],
    },
    notice: 'notice.chicken.bought',
  };
}

export function collectItem(state: LevelState, itemId: number): ActionResult {
  const item = state.items.find((entry) => entry.id === itemId);
  if (!item || state.status !== 'playing' || state.paused) {
    return { state };
  }
  const slots = item.kind === 'cage' ? balance.cageSlots : 1;
  if (warehouseUsed(state) + slots > balance.warehouseCapacity) {
    return {
      state,
      notice: item.kind === 'cage' ? 'notice.cage.slots' : 'notice.warehouse.full',
    };
  }
  const items = state.items.filter((entry) => entry.id !== itemId);
  const collectedLastCage =
    item.kind === 'cage' && !items.some((entry) => entry.kind === 'cage') && state.bear === null;
  return {
    state: {
      ...state,
      items,
      warehouseEggs: state.warehouseEggs + (item.kind === 'egg' ? 1 : 0),
      warehouseCages: state.warehouseCages + (item.kind === 'cage' ? 1 : 0),
      nextBearMs: collectedLastCage ? state.elapsedMs + balance.bearIntervalMs : state.nextBearMs,
    },
    notice: item.kind === 'egg' ? 'notice.egg.collected' : 'notice.cage.collected',
  };
}

function findSpawn(state: LevelState): { x: number; y: number; heading: number; rng: number } {
  let rng = state.rng;
  const rand = (): number => {
    const next = nextRand(rng);
    rng = next.seed;
    return next.value;
  };
  const min = balance.yardMargin;
  const spanX = balance.yardWidth - min * 2;
  const spanY = balance.yardHeight - min * 2;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const x = min + rand() * spanX;
    const y = min + rand() * spanY;
    const spot = { x, y };
    const crowded = state.chickens.some((chicken) => distance(chicken, spot) < 110);
    const onBear = state.bear !== null && distance(state.bear, spot) < balance.bearTapRadius;
    if (!crowded && !onBear) {
      return { x, y, heading: rand() * Math.PI * 2, rng };
    }
  }
  return {
    x: balance.yardWidth / 2,
    y: balance.yardHeight / 2,
    heading: rand() * Math.PI * 2,
    rng,
  };
}
