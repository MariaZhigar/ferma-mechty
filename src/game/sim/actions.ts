import { plantGrass } from './systems/grass';
import { buyChicken, collectItem, loadTruck, sendTruck } from './systems/economy';
import { tapBear } from './systems/predators';
import { inBounds, type ActionResult, type LevelState } from './state';

export function applyFieldTap(state: LevelState, x: number, y: number): ActionResult {
  if (state.status !== 'playing' || state.paused || !inBounds(state, x, y)) {
    return { state };
  }
  if (state.bear && Math.max(Math.abs(state.bear.x - x), Math.abs(state.bear.y - y)) <= 1) {
    return tapBear(state);
  }
  const item = state.items.find((entry) => entry.x === x && entry.y === y);
  if (item) {
    return collectItem(state, item.id);
  }
  const planted = plantGrass(state, x, y);
  if (planted === state) {
    return { state };
  }
  return { state: planted, notice: 'notice.grass.planted' };
}

export { buyChicken, loadTruck, sendTruck };
