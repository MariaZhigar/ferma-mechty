import type { ContentMode } from '../../../platform/schema';

export type { ContentMode };

export const DEFAULT_CONTENT_MODE = 'kids' satisfies ContentMode;

export function isMeatContentAllowed(mode: ContentMode): boolean {
  return mode === 'regular';
}

export function isEntryVisible(meat: boolean, mode: ContentMode): boolean {
  return !meat || isMeatContentAllowed(mode);
}
