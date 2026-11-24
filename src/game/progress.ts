import type { CampaignProgress, Medal } from '../platform/schema';
import { SCHEMA_VERSION } from '../platform/schema';
import { betterMedal } from './sim/systems/goals';
import type { LevelState } from './sim/state';

export function rememberLevel(progress: CampaignProgress, state: LevelState): CampaignProgress {
  return {
    ...progress,
    schemaVersion: SCHEMA_VERSION,
    activeLevel: { levelId: state.levelId, state },
  };
}

export function clearLevel(progress: CampaignProgress): CampaignProgress {
  return { ...progress, schemaVersion: SCHEMA_VERSION, activeLevel: null };
}

export function recordWin(
  progress: CampaignProgress,
  levelId: string,
  medal: Medal,
): CampaignProgress {
  return {
    ...clearLevel(progress),
    bestMedals: {
      ...progress.bestMedals,
      [levelId]: betterMedal(progress.bestMedals[levelId], medal),
    },
  };
}
