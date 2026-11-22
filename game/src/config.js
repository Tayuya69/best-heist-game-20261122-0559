// NIGHT VAULT — The Aurum Bank Job: tuning and palette.
// One place for every number the game balances on, so the whole job can be
// retuned without touching the logic. All speeds are pixels per second,
// all times are seconds, all angles are radians.

export const WORLD = { w: 1440, h: 900 };

export const VIEW = { w: 960, h: 600 };

export const PLAYER = {
  radius: 13,
  walkSpeed: 155,
  sneakSpeed: 88,
  // A sneaking thief is harder to see: guards fill suspicion slower and
  // their cones reach a little less far.
  sneakSightFactor: 0.62,
  sneakFillFactor: 0.55,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 58,
  chaseSpeed: 128,
  returnSpeed: 78,
  sightRange: 175,
  sightHalfAngle: 0.61, // ~35 degrees each side of facing
  suspectSeconds: 1.15, // continuous sight to go from calm to chase
  loseSightSeconds: 3.0, // unseen before a chasing guard gives up
  catchDistance: 26, // touching the thief ends the run (a heart)
};

export const CAMERA = {
  range: 205,
  halfAngle: 0.32, // a narrow beam, ~18 degrees each side
  sweepHalfAngle: 0.85, // how far the beam swings from its rest angle
  sweepSeconds: 3.4, // one full sweep out and back
  lockSeconds: 1.2, // continuous beam on the thief before it calls a guard
};

export const ALARM = {
  max: 100,
  guardChasePerSecond: 8,
  cameraLockPerSecond: 15,
  catchPenalty: 25,
  toolSmokeCost: 5,
  toolEmpCost: 8,
  dialMissCost: 10,
  decayPerSecond: 2.2, // bleeds off while nobody sees the thief
  ghostCeiling: 25, // stay under this all run for the ghost bonus
};

export const TIMER_SECONDS = 360; // 6:00 until dawn

export const LIVES = 3;

export const TOOLS = {
  smokeCharges: 2,
  smokeSeconds: 5,
  smokeRadius: 92,
  empCharges: 1,
  empSeconds: 20,
};

// The vault dial: a pointer spins and the thief locks three tumblers by
// stopping it inside each target arc. Each tumbler spins faster than the
// last, so the crack gets harder as the vault gives way.
export const DIAL = {
  tumblers: 3,
  targetArc: 0.9, // radians of green arc per tumbler (~52 degrees)
  speeds: [2.4, 3.3, 4.2], // radians per second, one per tumbler
};

export const LOOT = {
  cashValue: 100,
  goldValue: 250,
  bondValue: 150,
  diamondValue: 1000,
  ghostBonus: 500,
  timeBonusPerSecond: 2,
};

// Night-bank palette: deep blues, marble grey, gold. Safe cover is dark
// blue, danger is amber and red, loot is gold — readable at a glance.
export const PALETTE = {
  rooftopFloor: '#1c2433',
  officeFloor: '#232c3d',
  tradingFloor: '#1f2a3a',
  vaultFloor: '#26221f',
  wall: '#0d1119',
  wallTrim: '#c9a227',
  doorOpen: '#3d4a63',
  doorLocked: '#7a1f1f',
  coverDesk: '#4a3826',
  coverTerminal: '#14324a',
  coverPlant: '#1d3a24',
  coverSafe: '#3a3a42',
  guard: '#2e4a7a',
  guardCone: 'rgba(242, 193, 78, 0.20)',
  guardConeChase: 'rgba(224, 62, 52, 0.28)',
  cameraBeam: 'rgba(224, 62, 52, 0.16)',
  player: '#14161c',
  playerTrim: '#f2c14e',
  playerGlow: 'rgba(242, 193, 78, 0.35)',
  lootGold: '#f2c14e',
  lootCash: '#7fd08a',
  lootBond: '#8fb8e8',
  keycard: '#4fd2ff',
  vault: '#8a6d2f',
  vaultOpen: '#f2c14e',
  helipad: '#2e6b4f',
  smoke: 'rgba(160, 170, 185, 0.45)',
};
