// config.js — every tuned number for MIDNIGHT VAULT in one place.
// The heist: one night, one vault hall, one sapphire. Slip past the patrols,
// dodge the cameras, lift the Star Sapphire and walk out the green EXIT.

export const CANVAS = { width: 960, height: 600 };

// The playable hall: walls are a 24px border, the floor inside is 912 x 552.
export const HALL = { x: 24, y: 24, width: 912, height: 552 };

export const PLAYER = {
  radius: 13,
  walkSpeed: 178, // px per second
  sneakSpeed: 92, // Shift: slower, harder to spot
  clickSpeed: 178,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 62,
  huntSpeed: 128,
  returnSpeed: 78,
  catchRadius: 26, // a guard this close catches the thief
  visionRange: 215,
  visionFov: (72 * Math.PI) / 180, // total cone angle
  // Suspicion (0..100) while the thief stands inside a lit cone.
  suspicionPerSecond: 62,
  sneakSuspicionFactor: 0.45, // sneaking buys time inside a cone
  runSuspicionFactor: 1.35,
  suspicionDecayPerSecond: 26,
  alertAt: 100, // full suspicion: guard raises the alarm and hunts
  huntSeconds: 4.5,
  waitAtWaypointSeconds: 1.6,
  // How close the thief must be before a cone notices at all.
  noticeDistance: 215,
};

export const CAMERA = {
  range: 235,
  fov: (52 * Math.PI) / 180,
  sweepRadians: 0.85, // how far the lens swings each side of its base angle
  sweepSpeed: 0.55, // radians per second of phase
  alarmPerSecond: 26, // alarm gained while the thief is in a camera cone
};

export const ALARM = {
  max: 100,
  decayPerSecond: 3.0, // alarm slowly falls while nobody sees the thief
  guardAlertJump: 34, // alarm jump when a guard's suspicion fills
  lockdownAt: 100,
};

export const LOOT = {
  sapphire: { points: 500, channelSeconds: 1.5 }, // hold still at the case to crack it
  goldBar: { points: 150 },
  intel: { points: 150 },
  winBonusBase: 400,
};

export const SCORE = {
  // Win bonus shrinks with the clock: a clean fast job pays best.
  winBonusPerSecondLeft: 2,
  parSeconds: 240,
};

export const AUDIO = {
  enabled: true,
  footstepEverySeconds: 0.34,
};

// Palette: a night vault — dark marble, brass, red carpet, green exit.
export const COLORS = {
  floorA: '#20242e',
  floorB: '#1a1e27',
  carpet: '#5d1f26',
  carpetEdge: '#8a6d2f',
  wall: '#3a3f4d',
  wallTop: '#4b5162',
  caseGlass: 'rgba(140, 190, 220, 0.16)',
  caseFrame: '#8a6d2f',
  desk: '#4a3421',
  pillar: '#565d6e',
  safe: '#2e3442',
  exit: '#1f9d55',
  exitGlow: '#35d07f',
  sapphire: '#4fd2ff',
  gold: '#f2c14e',
  intel: '#e8e4d8',
  thief: '#15161c',
  thiefTrim: '#e8b23a',
  guard: '#31435c',
  guardTrim: '#d8dee9',
  cone: 'rgba(242, 193, 78, 0.20)',
  coneEdge: 'rgba(242, 193, 78, 0.55)',
  cameraCone: 'rgba(224, 82, 82, 0.16)',
  cameraConeEdge: 'rgba(224, 82, 82, 0.5)',
  hudBack: 'rgba(10, 12, 18, 0.88)',
  text: '#e8e4d8',
  textDim: '#9aa1b0',
  alarmLow: '#35d07f',
  alarmMid: '#f2c14e',
  alarmHigh: '#e05252',
};

// Tiny seeded RNG so screenshot scenes are reproducible (?seed=).
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
