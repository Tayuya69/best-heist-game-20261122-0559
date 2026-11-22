// NEON VAULT — The Golden Chip Job: tuning and palette.
// One place for every number the game balances on, so the whole job can be
// retuned without touching the logic. All speeds are pixels per second,
// all times are seconds, all angles are radians.

export const WORLD = { w: 1440, h: 900 };

export const VIEW = { w: 960, h: 600 };

export const PLAYER = {
  radius: 13,
  walkSpeed: 158,
  sneakSpeed: 90,
  // A sneaking thief is harder to see: guards fill suspicion slower and
  // their cones reach a little less far.
  sneakSightFactor: 0.62,
  sneakFillFactor: 0.55,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 60,
  chaseSpeed: 130,
  returnSpeed: 80,
  sightRange: 178,
  sightHalfAngle: 0.61, // ~35 degrees each side of facing
  suspectSeconds: 1.15, // continuous sight to go from calm to chase
  loseSightSeconds: 3.0, // unseen before a chasing guard gives up
  catchDistance: 26, // touching the thief ends the run (a heart)
};

export const CAMERA = {
  range: 208,
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
  lockMissCost: 10,
  decayPerSecond: 2.2, // bleeds off while nobody sees the thief
  ghostCeiling: 25, // stay under this all run for the ghost bonus
};

export const TIMER_SECONDS = 360; // 6:00 until the casino opens

export const LIVES = 3;

export const TOOLS = {
  smokeCharges: 2,
  smokeSeconds: 5,
  smokeRadius: 92,
  empCharges: 1,
  empSeconds: 20,
};

// The vault lock: a chip-sequence memory lock. The vault flashes a run of
// neon chips; the thief repeats it by pressing 1-4 or clicking the chips.
// Three rounds, each one chip longer, so the crack gets harder as the
// vault gives way. A wrong chip costs alarm.
export const LOCK = {
  rounds: 3,
  firstLength: 3, // round 1 shows 3 chips, round 2 shows 4, round 3 shows 5
  flashMs: 520, // how long each chip lights up
  gapMs: 220, // dark gap between flashes
};

export const LOOT = {
  chipValue: 50,
  cashValue: 100,
  goldValue: 250,
  jackpotValue: 1000,
  ghostBonus: 500,
  timeBonusPerSecond: 2,
};

// Neon-casino palette: deep purple floor, hot pink and cyan neon, gold.
// Safe cover is dark violet, danger is pink and red, loot is gold —
// readable at a glance, nothing like a grey office or a blue bank.
export const PALETTE = {
  garageFloor: '#1a1226',
  casinoFloor: '#241433',
  vipFloor: '#2e1a3d',
  cageFloor: '#2a1830',
  vaultFloor: '#33200f',
  wall: '#0a0512',
  wallTrim: '#ff2e88',
  doorOpen: '#4a2b6b',
  doorLocked: '#8a1f3d',
  coverSlot: '#3d1a5c',
  coverTable: '#14532d',
  coverRoulette: '#1a3a5c',
  coverCar: '#2b2f3a',
  coverCouch: '#5c1a3d',
  coverBar: '#3d2a10',
  guard: '#1e3a5f',
  guardCone: 'rgba(255, 46, 136, 0.20)',
  guardConeChase: 'rgba(255, 60, 60, 0.28)',
  cameraBeam: 'rgba(255, 60, 60, 0.24)',
  player: '#120d1a',
  playerTrim: '#ffd23e',
  playerGlow: 'rgba(255, 210, 62, 0.35)',
  lootGold: '#ffd23e',
  lootCash: '#7fd08a',
  lootChip: '#ff2e88',
  keycard: '#2ee6ff',
  vault: '#8a6d2f',
  vaultOpen: '#ffd23e',
  garageExit: '#2e6b4f',
  smoke: 'rgba(160, 170, 185, 0.45)',
  neonPink: '#ff2e88',
  neonCyan: '#2ee6ff',
  neonGold: '#ffd23e',
};
