import { describe, expect, it } from 'vitest';
import { formatBuildLabel, updateAction } from '../src/platform/updatePolicy';

describe('service worker update policy', () => {
  it('reloads between runs and keeps a level on screen', () => {
    expect(updateAction('Menu', true)).toBe('reload');
    expect(updateAction('Result', true)).toBe('reload');
    expect(updateAction('Boot', true)).toBe('reload');
    expect(updateAction('Level', true)).toBe('banner');
  });

  it('does not reload the first install', () => {
    expect(updateAction('Menu', false)).toBe('ignore');
    expect(updateAction('Level', false)).toBe('ignore');
  });

  it('shows the package version and a short commit', () => {
    expect(formatBuildLabel('0.0.1', '7920a916b95d60df')).toBe('0.0.1 · 7920a91');
  });
});
