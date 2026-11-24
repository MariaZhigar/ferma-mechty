import { balance } from '../../../data/balance';
import type { ContentMode } from './contentMode';
import type { LevelState } from '../state';
import type { Medal } from '../../../platform/schema';

export interface GoalOption {
  id: string;
  labelKey: string;
  meat: boolean;
}

/** Kids mode uses the non-meat goal. Regular mode keeps the card's first option. */
export function resolveGoal(
  options: readonly GoalOption[],
  mode: ContentMode,
): GoalOption | undefined {
  if (mode === 'kids') {
    return options.find((option) => !option.meat);
  }
  return options[0];
}

export function evaluateLevel(state: LevelState): LevelState {
  if (state.status !== 'playing') {
    return state;
  }
  if (state.soldEggs >= balance.goalSoldEggs) {
    return { ...state, status: 'won' };
  }
  if (state.elapsedMs >= balance.levelTimeMs) {
    return { ...state, status: 'lost' };
  }
  return state;
}

export function medalForWin(elapsedMs: number): Medal {
  const remaining = balance.levelTimeMs - elapsedMs;
  if (remaining >= balance.medalGoldRemainingMs) {
    return 'gold';
  }
  if (remaining >= balance.medalSilverRemainingMs) {
    return 'silver';
  }
  return 'bronze';
}

const medalRank: Record<Medal, number> = { bronze: 1, silver: 2, gold: 3 };

export function betterMedal(current: Medal | undefined, next: Medal): Medal {
  if (!current || medalRank[next] > medalRank[current]) {
    return next;
  }
  return current;
}
