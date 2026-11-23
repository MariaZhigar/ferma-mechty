import type { ContentMode } from './contentMode';

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
