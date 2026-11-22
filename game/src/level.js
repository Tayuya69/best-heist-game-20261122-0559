// NEON VAULT — The Golden Chip Job: the casino floor.
// One 1440x900 floor in four bands: the VIP lounge and the vault room up
// top, the gambling floor in the middle, the cashier cage at the right, and
// the parking garage along the bottom. Walls are rects with door gaps; the
// vault door is a locked door the VIP keycard opens. Cover rects block
// movement and sight. Every waypoint the thief must reach is listed in
// WAYPOINTS so a test can prove the whole job is walkable.

import { WORLD } from './config.js';

export const ENTRY = { x: 90, y: 830 };
export const ESCAPE = { x: 90, y: 830, r: 34 };

// Floor zones, drawn back to front. The garage is the bottom band, the
// gambling floor is the middle, the VIP lounge and vault room share the
// top band, and the cage sits inside the gambling floor's right side.
export const ZONES = [
  { x: 0, y: 0, w: 1020, h: 280, floor: 'vipFloor', label: 'VIP LOUNGE' },
  { x: 1036, y: 0, w: 404, h: 280, floor: 'vaultFloor', label: 'VAULT' },
  { x: 0, y: 296, w: 1440, h: 344, floor: 'casinoFloor', label: 'CASINO FLOOR' },
  { x: 1096, y: 436, w: 344, h: 204, floor: 'cageFloor', label: 'CASHIER' },
  { x: 0, y: 656, w: 1440, h: 244, floor: 'garageFloor', label: 'PARKING' },
];

// Walls: thickness 16. The y=280 wall splits the top band from the floor
// (doors at x 120-200 and 640-720); the y=640 wall splits the floor from
// the garage (doors at 120-200, 640-720, 1200-1280). The vault room's left
// wall has its door gap at y 120-200; the cage's left wall has its door
// gap at y 500-580 and its top wall is solid.
export const WALLS = [
  { x: 0, y: 280, w: 120, h: 16 },
  { x: 200, y: 280, w: 440, h: 16 },
  { x: 720, y: 280, w: 720, h: 16 },
  { x: 0, y: 640, w: 120, h: 16 },
  { x: 200, y: 640, w: 440, h: 16 },
  { x: 720, y: 640, w: 480, h: 16 },
  { x: 1280, y: 640, w: 160, h: 16 },
  { x: 1020, y: 0, w: 16, h: 120 },
  { x: 1020, y: 200, w: 16, h: 80 },
  { x: 1080, y: 420, w: 360, h: 16 },
  { x: 1080, y: 420, w: 16, h: 80 },
  { x: 1080, y: 580, w: 16, h: 60 },
];

// The vault door fills the vault room's door gap. It blocks movement and
// sight until the thief carries the VIP keycard.
export const DOORS = [
  { id: 'vault', x: 1020, y: 120, w: 16, h: 80, locked: true },
];

// Cover: slot machines, card tables, the roulette wheel, VIP couches and
// the bar, the cage counter, and parked cars. Each rect blocks movement
// and sight, so the thief reads the room and picks a route between them.
export const COVER = [
  // Slot machines, two rows on the gambling floor. The lanes between
  // them are 50 wide, so the 26-wide thief slips through without wedging.
  { x: 200, y: 340, w: 70, h: 50, kind: 'slot' },
  { x: 320, y: 340, w: 70, h: 50, kind: 'slot' },
  { x: 440, y: 340, w: 70, h: 50, kind: 'slot' },
  { x: 560, y: 340, w: 70, h: 50, kind: 'slot' },
  { x: 200, y: 480, w: 70, h: 50, kind: 'slot' },
  { x: 320, y: 480, w: 70, h: 50, kind: 'slot' },
  { x: 440, y: 480, w: 70, h: 50, kind: 'slot' },
  { x: 560, y: 480, w: 70, h: 50, kind: 'slot' },
  // Card tables and the roulette wheel.
  { x: 760, y: 360, w: 120, h: 70, kind: 'table' },
  { x: 760, y: 520, w: 120, h: 70, kind: 'table' },
  { x: 950, y: 440, w: 90, h: 90, kind: 'roulette' },
  // VIP lounge: couches and the bar.
  { x: 120, y: 60, w: 110, h: 50, kind: 'couch' },
  { x: 420, y: 60, w: 110, h: 50, kind: 'couch' },
  { x: 600, y: 60, w: 180, h: 40, kind: 'bar' },
  // Cashier cage counter.
  { x: 1150, y: 470, w: 220, h: 30, kind: 'counter' },
  // Parked cars in the garage, two rows, the left lane kept clear.
  { x: 320, y: 700, w: 110, h: 60, kind: 'car' },
  { x: 540, y: 700, w: 110, h: 60, kind: 'car' },
  { x: 760, y: 700, w: 110, h: 60, kind: 'car' },
  { x: 980, y: 700, w: 110, h: 60, kind: 'car' },
  { x: 320, y: 800, w: 110, h: 60, kind: 'car' },
  { x: 540, y: 800, w: 110, h: 60, kind: 'car' },
  { x: 760, y: 800, w: 110, h: 60, kind: 'car' },
  { x: 980, y: 800, w: 110, h: 60, kind: 'car' },
];

// The VIP keycard lies on the VIP table; the cage alarm panel sits behind
// the cashier counter; the vault holds the jackpot.
export const KEYCARD = { x: 300, y: 140, taken: false };
export const CAGE_PANEL = { x: 1260, y: 540, disabled: false };
export const VAULT = { x: 1230, y: 140, opened: false };

// Loose loot: chip stacks, cash and gold bars scattered where the thief
// has to cross a guard's cone to reach them.
export const LOOT = [
  { x: 260, y: 420, kind: 'chip', value: 50, taken: false },
  { x: 900, y: 340, kind: 'chip', value: 50, taken: false },
  { x: 700, y: 600, kind: 'chip', value: 50, taken: false },
  { x: 1100, y: 700, kind: 'chip', value: 50, taken: false },
  { x: 180, y: 600, kind: 'cash', value: 100, taken: false },
  { x: 1000, y: 560, kind: 'cash', value: 100, taken: false },
  { x: 400, y: 820, kind: 'cash', value: 100, taken: false },
  { x: 500, y: 120, kind: 'gold', value: 250, taken: false },
  { x: 1350, y: 600, kind: 'gold', value: 250, taken: false },
];

// Guard patrols: name, waypoints, and the floor each one watches. Every
// leg runs down a clear lane — between the slot rows, beside the tables,
// clear of the roulette and the cage — so no guard ever clips through
// the furniture it is supposed to watch.
export const GUARD_ROUTES = [
  { name: 'Dante', pts: [[100, 320], [100, 600], [660, 600], [660, 320]] },
  { name: 'Mira', pts: [[900, 320], [900, 600], [1060, 600], [1060, 320]] },
  { name: 'Vince', pts: [[150, 150], [900, 150], [900, 240], [150, 240]] },
  { name: 'Lola', pts: [[300, 680], [1300, 680], [1300, 880], [300, 880]] },
  { name: 'Rex', pts: [[720, 460], [720, 620], [900, 620], [900, 460]] },
];

// Cameras: fixed mounts that sweep a beam. Their rest angle points into
// the room they watch.
export const CAMERAS = [
  { x: 60, y: 300, rest: 0.6 },
  { x: 1380, y: 300, rest: Math.PI - 0.6 },
  { x: 1380, y: 880, rest: Math.PI + 0.6 },
  { x: 60, y: 40, rest: 0.9 },
];

// Every stop the job must reach, in the order the thief reaches them.
// The test walks this list to prove the casino is traversable.
export const WAYPOINTS = [
  { x: 90, y: 830, name: 'entry' },
  { x: 720, y: 480, name: 'casino floor' },
  { x: 300, y: 140, name: 'keycard' },
  { x: 1260, y: 540, name: 'cage panel' },
  { x: 1020, y: 160, name: 'vault door' },
  { x: 1230, y: 140, name: 'vault' },
  { x: 90, y: 830, name: 'escape' },
];

// --- geometry helpers shared by the player, the guards and the test ---

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

// All solid rects right now: walls, locked doors, and cover.
export function solidRects(doors) {
  const out = [...WALLS, ...COVER];
  for (const d of doors) if (d.locked) out.push(d);
  return out;
}

// True when the segment from (x1,y1) to (x2,y2) crosses any solid rect.
// Used for guard and camera sight: a wall or a slot machine between the
// watcher and the thief hides the thief.
export function sightBlocked(x1, y1, x2, y2, solids) {
  for (const s of solids) {
    if (segmentHitsRect(x1, y1, x2, y2, s)) return true;
  }
  return false;
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Slab test: the segment enters the rect when its parametric interval
  // overlaps the rect on both axes.
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let a = (r.x - x1) / dx;
    let b = (r.x + r.w - x1) / dx;
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
    if (t0 > t1) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let a = (r.y - y1) / dy;
    let b = (r.y + r.h - y1) / dy;
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
    if (t0 > t1) return false;
  }
  return true;
}

// Move a circle by (dx,dy) against the solid rects, sliding along walls
// instead of sticking: try the full move, then each axis on its own.
export function moveCircle(x, y, r, dx, dy, solids) {
  let nx = x + dx;
  let ny = y + dy;
  if (!hitsAny(nx, ny, r, solids)) return { x: nx, y: ny };
  if (!hitsAny(nx, y, r, solids)) return { x: nx, y };
  if (!hitsAny(x, ny, r, solids)) return { x, y: ny };
  return { x, y };
}

function hitsAny(x, y, r, solids) {
  if (x < r || x > WORLD.w - r || y < r || y > WORLD.h - r) return true;
  for (const s of solids) if (circleHitsRect(x, y, r, s)) return true;
  return false;
}
