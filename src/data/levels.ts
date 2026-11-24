import type { LevelDef } from './types';

/** One prototype level. The same egg goal is used in both content modes. */
export const levels: readonly LevelDef[] = [
  {
    id: 'level-1',
    goals: [{ id: 'sell-eggs', labelKey: 'goal.sellEggs', meat: false }],
  },
];
