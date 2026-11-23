import { SCHEMA_VERSION } from '../../platform/schema';
import { DEFAULT_CONTENT_MODE, type ContentMode } from './systems/contentMode';

/** Fixed simulation step. A long gap, pause, or hidden tab must not fast-forward the clock. */
export const SIM_STEP_MS = 1000 / 60;

export interface LevelState {
  schemaVersion: number;
  contentMode: ContentMode;
  money: number;
  elapsedMs: number;
  paused: boolean;
}

export function createLevelState(contentMode: ContentMode = DEFAULT_CONTENT_MODE): LevelState {
  return {
    schemaVersion: SCHEMA_VERSION,
    contentMode,
    money: 0,
    elapsedMs: 0,
    paused: false,
  };
}

export function stepLevel(state: LevelState, deltaMs: number): LevelState {
  if (state.paused || deltaMs <= 0) {
    return state;
  }
  return { ...state, elapsedMs: state.elapsedMs + Math.min(deltaMs, SIM_STEP_MS) };
}
