import { describe, expect, it } from 'vitest';
import { isEntryVisible, isMeatContentAllowed } from '../src/game/sim/systems/contentMode';
import { resolveGoal } from '../src/game/sim/systems/goals';
import { createLevelState, SIM_STEP_MS } from '../src/game/sim/state';
import { stepLevel } from '../src/game/sim/step';

describe('content mode', () => {
  it('hides meat in kids mode and keeps it in regular mode', () => {
    expect(isMeatContentAllowed('kids')).toBe(false);
    expect(isMeatContentAllowed('regular')).toBe(true);
    expect(isEntryVisible(true, 'kids')).toBe(false);
    expect(isEntryVisible(false, 'kids')).toBe(true);
    expect(isEntryVisible(true, 'regular')).toBe(true);
  });

  it('replaces a meat goal in kids mode and keeps it in regular mode', () => {
    const options = [
      { id: 'sausage', labelKey: 'goal.sausage', meat: true },
      { id: 'cheese', labelKey: 'goal.cheese', meat: false },
    ];
    expect(resolveGoal(options, 'kids')?.id).toBe('cheese');
    expect(resolveGoal(options, 'regular')?.id).toBe('sausage');
    expect(resolveGoal([], 'regular')).toBeUndefined();
  });

  it('starts a level in kids mode and does not catch up a long pause', () => {
    const state = createLevelState();
    expect(state.contentMode).toBe('kids');
    expect(stepLevel(state, 10_000).elapsedMs).toBe(SIM_STEP_MS);
    expect(stepLevel({ ...state, paused: true }, 10_000).elapsedMs).toBe(0);
  });
});
