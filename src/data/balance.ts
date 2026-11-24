/**
 * M1 yard numbers, rewritten for a free meadow. The same figures are in docs/balance.md.
 * The yard is a 1000×1000 pen. Speeds are units per second.
 */
export const balance = {
  yardWidth: 1000,
  yardHeight: 1000,
  yardMargin: 72,

  grassGrowMs: 2200,
  grassSpacing: 170,
  grassMargin: 72,
  maxGrass: 12,
  plantClearance: 78,

  wellCapacity: 5,
  wellStart: 5,
  wellFillCost: 1,
  wellFillMs: 1300,

  chickenWanderSpeed: 70,
  chickenSeekSpeed: 180,
  chickenPanicSpeed: 210,
  chickenEatRadius: 64,
  chickenWanderMs: 1100,
  seekFoodMs: 1200,
  eggIntervalMs: 3500,
  hungerStarveMs: 15000,
  hungerDeathMs: 40000,
  chickenPrice: 12,
  startingChickens: 1,
  startingMoney: 0,
  maxChickens: 6,

  eggLifeMs: 14000,
  eggBlinkMs: 3500,
  itemTapRadius: 92,

  warehouseCapacity: 8,
  cageSlots: 3,
  truckCapacity: 6,
  truckTripMs: 4500,
  eggPrice: 4,
  cagePrice: 18,
  cageEscapeMs: 10000,
  cageBlinkMs: 3000,

  bearFirstMs: 25000,
  bearIntervalMs: 20000,
  bearTaps: 5,
  bearLifetimeMs: 12000,
  bearSpoilMs: 2000,
  bearSpoilRadius: 90,
  bearWanderSpeed: 64,
  bearSeekSpeed: 108,
  bearTapRadius: 120,
  bearWanderMs: 800,

  levelTimeMs: 180000,
  goalSoldEggs: 6,
  medalGoldRemainingMs: 70000,
  medalSilverRemainingMs: 25000,
} as const;
