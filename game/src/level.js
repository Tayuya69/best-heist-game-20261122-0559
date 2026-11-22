// MIDNIGHT EXPRESS — The Gold Train Job: the train itself.
// The train is five cars laid out left to right. The thief boards the
// baggage car, works through the dining car, the sleeper car and the vault
// car, and escapes through the locomotive door at the far right. Every
// position here is in world coordinates; the canvas camera follows the
// thief. The floor line is the same everywhere so the player, the guards
// and the crates all share one ground.

export const VIEW_W = 960;
export const VIEW_H = 600;
export const FLOOR_Y = 480;
export const WORLD_W = 4500;
export const CAR_W = 900;
export const GOLD_NEEDED = 10;
export const TIME_LIMIT = 150;
export const START_LIVES = 3;

export const CARS = [
  { name: 'BAGGAGE', color: '#2e2a3f', trim: '#4a4364', floor: '#3a3247' },
  { name: 'DINING', color: '#3d2a2a', trim: '#6b4444', floor: '#4a3232' },
  { name: 'SLEEPER', color: '#1e2f3a', trim: '#33505f', floor: '#27393f' },
  { name: 'VAULT', color: '#3a3520', trim: '#6b5f33', floor: '#46402a' },
  { name: 'LOCOMOTIVE', color: '#22242a', trim: '#454a55', floor: '#2e3138' },
];

// Crates are solid: the thief can stand on them and they block sight.
// x, y (top), w, h. They sit on the floor unless y is higher (stacked).
// The baggage car opens clear so the thief can run and learn the
// controls before the first jump; obstacles start at x=500.
export const CRATES = [
  { x: 620, y: 432, w: 70, h: 48 },
  { x: 1080, y: 432, w: 70, h: 48 },
  { x: 1500, y: 448, w: 60, h: 32 },
  { x: 1980, y: 432, w: 70, h: 48 },
  { x: 2300, y: 432, w: 70, h: 48 },
  { x: 2880, y: 432, w: 70, h: 48 },
  { x: 3100, y: 408, w: 60, h: 72 },
  { x: 3350, y: 448, w: 60, h: 32 },
  { x: 3750, y: 448, w: 60, h: 32 },
];

// Luggage is low and solid: jump it, don't walk through it.
export const LUGGAGE = [
  { x: 500, y: 450, w: 60, h: 30 },
  { x: 1300, y: 450, w: 60, h: 30 },
  { x: 1650, y: 450, w: 60, h: 30 },
  { x: 2150, y: 450, w: 60, h: 30 },
  { x: 2950, y: 450, w: 60, h: 30 },
  { x: 3250, y: 450, w: 60, h: 30 },
  { x: 3900, y: 450, w: 60, h: 30 },
];

// Gold bars. x, y is the centre. 24 in all; the locomotive door needs 10.
export const GOLD = [
  { x: 140, y: 462 }, { x: 250, y: 462 }, { x: 330, y: 462 },
  { x: 600, y: 462 }, { x: 760, y: 462 },
  { x: 980, y: 462 }, { x: 1150, y: 415 }, { x: 1400, y: 462 },
  { x: 1560, y: 380 }, { x: 1720, y: 462 },
  { x: 1900, y: 462 }, { x: 2050, y: 415 }, { x: 2200, y: 462 },
  { x: 2400, y: 380 }, { x: 2580, y: 462 },
  { x: 2800, y: 462 }, { x: 2950, y: 415 }, { x: 3050, y: 380 },
  { x: 3180, y: 462 }, { x: 3300, y: 415 }, { x: 3450, y: 462 },
  { x: 3560, y: 380 },
  { x: 3700, y: 462 }, { x: 3850, y: 462 },
];

// Guards walk a patrol beat and watch the car ahead of them.
// x is the start, minX/maxX the beat, speed the patrol walk.
export const GUARDS = [
  { x: 1350, minX: 1150, maxX: 1600, speed: 55 },
  { x: 2250, minX: 2050, maxX: 2500, speed: 60 },
  { x: 2950, minX: 2800, maxX: 3150, speed: 65 },
  { x: 3400, minX: 3250, maxX: 3550, speed: 65 },
  { x: 4050, minX: 3900, maxX: 4200, speed: 70 },
];

// Cameras hang from the ceiling and sweep a beam across the floor.
// x, y is the mount, arc the half-sweep in radians, rate the sweep speed.
export const CAMERAS = [
  { x: 1450, y: 96, arc: 0.78, rate: 0.6 },
  { x: 2350, y: 96, arc: 0.87, rate: 0.7 },
  { x: 3050, y: 96, arc: 0.78, rate: 0.8 },
  { x: 3450, y: 96, arc: 0.87, rate: 0.7 },
  { x: 4000, y: 96, arc: 0.7, rate: 0.9 },
];

// The escape: the locomotive door at the far right of the train.
export const LOCO_DOOR = { x: 4380, y: 360, w: 70, h: 120 };

// Where the thief respawns after being caught, one per car.
export const CHECKPOINTS = [60, 940, 1840, 2740, 3640];
