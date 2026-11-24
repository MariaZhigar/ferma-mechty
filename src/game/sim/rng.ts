/** Deterministic 32-bit step so a saved level resumes the same walks. */
export function nextRand(seed: number): { seed: number; value: number } {
  let next = (seed + 0x6d2b79f5) >>> 0;
  next = Math.imul(next ^ (next >>> 15), next | 1);
  next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
  const mixed = (next ^ (next >>> 14)) >>> 0;
  return { seed: next >>> 0, value: mixed / 4294967296 };
}
