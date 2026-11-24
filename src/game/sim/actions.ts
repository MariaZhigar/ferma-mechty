import { distance, inYard } from './motion';
import { buyChicken, collectItem, loadTruck, sendTruck } from './systems/economy';
import { plantGrass } from './systems/grass';
import { tapBear } from './systems/predators';
import { tapWell } from './systems/well';
import { type ActionResult, type LevelState, type TapRadii } from './state';
import { balance } from '../../data/balance';

export function applyFieldTap(
  state: LevelState,
  x: number,
  y: number,
  radii: TapRadii = { item: balance.itemTapRadius, bear: balance.bearTapRadius },
): ActionResult {
  if (state.status !== 'playing' || state.paused || !inYard(x, y)) {
    return { state };
  }
  const spot = { x, y };
  if (state.bear && distance(state.bear, spot) <= radii.bear) {
    return tapBear(state);
  }
  let closest: { id: number; away: number } | null = null;
  for (const item of state.items) {
    const away = distance(item, spot);
    if (away <= radii.item && (closest === null || away < closest.away)) {
      closest = { id: item.id, away };
    }
  }
  if (closest) {
    return collectItem(state, closest.id);
  }
  return plantGrass(state, x, y);
}

export { buyChicken, loadTruck, sendTruck, tapWell };
