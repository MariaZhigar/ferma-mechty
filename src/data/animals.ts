import type { AnimalDef } from './types';

/** M1 herd: the chicken only. Meat stays off until a later stage. */
export const animals: readonly AnimalDef[] = [
  { id: 'chicken', nameKey: 'entity.chicken', meat: false },
];
