import { balance } from '../../../data/balance';
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
  const cages = Math.min(space, state.warehouseCages);
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
  const spot = firstOpenCell(state);
  return {
    state: {
      ...state,
      money: state.money - balance.chickenPrice,
      nextId: state.nextId + 1,
      chickens: [
        ...state.chickens,
        { id: state.nextId, x: spot.x, y: spot.y, hungerMs: 0, eggMs: 0, moveMs: 0 },
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
  if (warehouseUsed(state) >= balance.warehouseCapacity) {
    return { state, notice: 'notice.warehouse.full' };
  }
  return {
    state: {
      ...state,
      items: state.items.filter((entry) => entry.id !== itemId),
      warehouseEggs: state.warehouseEggs + (item.kind === 'egg' ? 1 : 0),
      warehouseCages: state.warehouseCages + (item.kind === 'cage' ? 1 : 0),
    },
    notice: item.kind === 'egg' ? 'notice.egg.collected' : 'notice.cage.collected',
  };
}

function firstOpenCell(state: LevelState): { x: number; y: number } {
  for (let y = 0; y < state.rows; y += 1) {
    for (let x = 0; x < state.cols; x += 1) {
      if (!state.chickens.some((chicken) => chicken.x === x && chicken.y === y)) {
        return { x, y };
      }
    }
  }
  return { x: 0, y: 0 };
}
