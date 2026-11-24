/**
 * M1 starting numbers. The same figures are written out in docs/balance.md.
 * Mary can retune them without changing the rules in the GDD.
 */
export const balance = {
  gridCols: 6,
  gridRows: 6,
  grassGrowMs: 2000,
  chickenMoveMs: 380,
  eggIntervalMs: 3500,
  hungerStarveMs: 15000,
  hungerDeathMs: 40000,
  warehouseCapacity: 8,
  truckCapacity: 6,
  truckTripMs: 4500,
  eggPrice: 4,
  cagePrice: 10,
  chickenPrice: 12,
  startingChickens: 1,
  startingMoney: 0,
  maxChickens: 6,
  bearFirstMs: 25000,
  bearIntervalMs: 20000,
  bearTaps: 5,
  bearLifetimeMs: 12000,
  bearSpoilMs: 2000,
  bearMoveMs: 700,
  levelTimeMs: 180000,
  goalSoldEggs: 6,
  medalGoldRemainingMs: 70000,
  medalSilverRemainingMs: 25000,
} as const;
