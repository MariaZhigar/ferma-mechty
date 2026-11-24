import type { LevelState } from './state';
import { SIM_STEP_MS } from './state';
import { tickChickens } from './systems/animals';
import { tickTruck } from './systems/economy';
import { evaluateLevel } from './systems/goals';
import { tickGrass } from './systems/grass';
import { tickBear } from './systems/predators';
import { tickProduction } from './systems/production';

export function stepLevel(state: LevelState, deltaMs: number): LevelState {
  if (state.paused || state.status !== 'playing' || deltaMs <= 0) {
    return state;
  }
  const dt = Math.min(deltaMs, SIM_STEP_MS);
  const stepped: LevelState = { ...state, elapsedMs: state.elapsedMs + dt };
  return evaluateLevel(
    tickTruck(tickBear(tickChickens(tickProduction(tickGrass(stepped, dt)), dt), dt), dt),
  );
}
