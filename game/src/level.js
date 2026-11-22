// NIGHT VAULT — the Aurum Bank tower floor plan.
// The tower is one floor, 1440 by 900, in four bands: the rooftop (entry
// and escape), the executive offices (the keycard), the trading floor
// (open, watched), and the vault floor (the vault). Walls are solid
// rectangles; doors are gaps in them. Cover blocks movement and sight.
// Geometry helpers here answer the two questions the game keeps asking:
// can a circle move here, and can one point see another?

import { WORLD } from './config.js';

const WALL = 12; // wall thickness

// Every wall is { x, y, w, h }. Doors are simply gaps: no wall is drawn
// where a door belongs. The vault-floor door is a separate locked door.
export const WALLS = [
  // Outer shell.
  { x: 0, y: 0, w: WORLD.w, h: WALL },
  { x: 0, y: WORLD.h - WALL, w: WORLD.w, h: WALL },
  { x: 0, y: 0, w: WALL, h: WORLD.h },
  { x: WORLD.w - WALL, y: 0, w: WALL, h: WORLD.h },
  // Rooftop / offices boundary (y = 180), doors at x 300-380 and 1060-1140.
  { x: WALL, y: 180, w: 288, h: WALL },
  { x: 380, y: 180, w: 680, h: WALL },
  { x: 1140, y: 180, w: 288, h: WALL },
  // Offices / trading boundary (y = 450), doors at x 500-580 and 860-940.
  { x: WALL, y: 450, w: 488, h: WALL },
  { x: 580, y: 450, w: 280, h: WALL },
  { x: 940, y: 450, w: 488, h: WALL },
  // Trading / vault boundary (y = 700), one gap for the locked door.
  { x: WALL, y: 700, w: 648, h: WALL },
  { x: 780, y: 700, w: 648, h: WALL },
  // Manager's office (left), split from the corridor at x = 480.
  { x: 480, y: 180, w: WALL, h: 100 },
  { x: 480, y: 360, w: WALL, h: 90 },
  // Meeting room (right), split from the corridor at x = 960.
  { x: 960, y: 180, w: WALL, h: 100 },
  { x: 960, y: 360, w: WALL, h: 90 },
  // Vault room (centre of the vault floor), doorway at x 660-780 on top.
  { x: 540, y: 740, w: 120, h: WALL },
  { x: 780, y: 740, w: 120, h: WALL },
  { x: 540, y: 740, w: WALL, h: 140 },
  { x: 888, y: 740, w: WALL, h: 140 },
];

// The vault-floor door: solid until the keycard opens it.
export const VAULT_DOOR = { x: 660, y: 700, w: 120, h: WALL, locked: true };

// Cover: solid blocks that stop movement and block sight. Each has a kind
// so the renderer can draw it as a desk, a terminal, a planter or a safe.
export const COVER = [
  // Rooftop: air-conditioning units and planters.
  { x: 200, y: 60, w: 120, h: 60, kind: 'unit' },
  { x: 1100, y: 60, w: 120, h: 60, kind: 'unit' },
  { x: 500, y: 60, w: 80, h: 40, kind: 'plant' },
  { x: 820, y: 60, w: 80, h: 40, kind: 'plant' },
  // Offices: the manager's desk (the keycard sits on it), meeting desk,
  // and two work desks in the central corridor.
  { x: 240, y: 280, w: 120, h: 50, kind: 'desk' },
  { x: 1080, y: 280, w: 120, h: 50, kind: 'desk' },
  { x: 600, y: 300, w: 100, h: 50, kind: 'desk' },
  { x: 780, y: 300, w: 100, h: 50, kind: 'desk' },
  // Trading floor: two rows of terminal desks.
  { x: 200, y: 520, w: 160, h: 60, kind: 'terminal' },
  { x: 500, y: 520, w: 160, h: 60, kind: 'terminal' },
  { x: 800, y: 520, w: 160, h: 60, kind: 'terminal' },
  { x: 1100, y: 520, w: 160, h: 60, kind: 'terminal' },
  { x: 350, y: 620, w: 160, h: 60, kind: 'terminal' },
  { x: 950, y: 620, w: 160, h: 60, kind: 'terminal' },
  // Vault floor: gold pallets inside the vault room and a security desk.
  { x: 580, y: 780, w: 70, h: 46, kind: 'safe' },
  { x: 800, y: 780, w: 70, h: 46, kind: 'safe' },
  { x: 1100, y: 780, w: 120, h: 50, kind: 'desk' },
];

// The vault itself: a big circular safe door at the back of the vault room.
export const VAULT = { x: 720, y: 828, radius: 42 };

// The helicopter pad on the rooftop: the escape. Win by standing on it
// with the diamond.
export const HELIPAD = { x: 120, y: 90, radius: 46 };

// Where the thief drops in, and where a caught thief wakes up again.
export const ENTRY = { x: 720, y: 150 };

// The keycard, on the manager's desk — just in front of it, where a
// thief can actually reach it.
export const KEYCARD = { x: 300, y: 348 };

// Side loot: cash stacks, gold bars and bonds scattered through the tower.
export const LOOT_SPOTS = [
  { x: 260, y: 340, kind: 'cash' },
  { x: 1120, y: 340, kind: 'cash' },
  { x: 250, y: 560, kind: 'cash' },
  { x: 600, y: 560, kind: 'cash' },
  { x: 900, y: 560, kind: 'cash' },
  { x: 1200, y: 560, kind: 'cash' },
  { x: 620, y: 800, kind: 'gold' },
  { x: 840, y: 800, kind: 'gold' },
  { x: 700, y: 300, kind: 'bond' },
  { x: 1150, y: 800, kind: 'bond' },
];

// Guard patrols. A guard walks its waypoints; 'loop' returns to the first
// and goes around again, 'pingpong' walks back along the same route.
export const GUARD_ROUTES = [
  { name: 'Rook', waypoints: [{ x: 600, y: 250 }, { x: 840, y: 250 }], mode: 'pingpong' },
  { name: 'Vera', waypoints: [{ x: 200, y: 500 }, { x: 400, y: 500 }, { x: 400, y: 650 }, { x: 200, y: 650 }], mode: 'loop' },
  { name: 'Kane', waypoints: [{ x: 1000, y: 550 }, { x: 1250, y: 550 }], mode: 'pingpong' },
  { name: 'Sable', waypoints: [{ x: 600, y: 850 }, { x: 840, y: 850 }], mode: 'pingpong' },
  { name: 'Moss', waypoints: [{ x: 300, y: 100 }, { x: 1100, y: 100 }], mode: 'pingpong' },
];

// Cameras are wall mounts. Each sweeps its beam around restAngle; the beam
// is drawn from the mount and locks on when the thief stands in it.
export const CAMERAS = [
  { x: 720, y: 200, restAngle: Math.PI / 2 },
  { x: 300, y: 470, restAngle: Math.PI / 2 },
  { x: 1140, y: 470, restAngle: Math.PI / 2 },
  { x: 720, y: 720, restAngle: Math.PI / 2 },
];

// --- Geometry: the only math the game needs. ---

// Every solid thing in the world: walls, cover, and the locked vault door
// while it is locked. The vault door is passed in because it can open.
export function solids(vaultDoorLocked) {
  const list = WALLS.concat(COVER);
  if (vaultDoorLocked) list.push(VAULT_DOOR);
  return list;
}

function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

// True when a circle at (x, y) with radius r touches any solid.
export function collides(x, y, r, vaultDoorLocked) {
  for (const s of solids(vaultDoorLocked)) {
    if (circleHitsRect(x, y, r, s)) return true;
  }
  return false;
}

// Move a circle by (dx, dy) with wall sliding: try the full move, then
// each axis alone, so the thief slides along walls instead of sticking.
export function moveCircle(x, y, r, dx, dy, vaultDoorLocked) {
  if (!collides(x + dx, y + dy, r, vaultDoorLocked)) return { x: x + dx, y: y + dy };
  if (!collides(x + dx, y, r, vaultDoorLocked)) return { x: x + dx, y };
  if (!collides(x, y + dy, r, vaultDoorLocked)) return { x, y: y + dy };
  return { x, y };
}

function segmentHitsRect(x1, y1, x2, y2, rect) {
  // A segment hits a rectangle when either end is inside it, or it
  // crosses one of its four edges.
  if (x1 >= rect.x && x1 <= rect.x + rect.w && y1 >= rect.y && y1 <= rect.y + rect.h) return true;
  if (x2 >= rect.x && x2 <= rect.x + rect.w && y2 >= rect.y && y2 <= rect.y + rect.h) return true;
  const edges = [
    [rect.x, rect.y, rect.x + rect.w, rect.y],
    [rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h],
    [rect.x, rect.y + rect.h, rect.x, rect.y],
  ];
  for (const [ax, ay, bx, by] of edges) {
    if (segmentsCross(x1, y1, x2, y2, ax, ay, bx, by)) return true;
  }
  return false;
}

function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
  if (d === 0) return false;
  const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
  const u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

// True when nothing solid stands between (x1, y1) and (x2, y2). Guards
// and cameras use this before they can see the thief.
export function hasLineOfSight(x1, y1, x2, y2, vaultDoorLocked) {
  for (const s of solids(vaultDoorLocked)) {
    if (segmentHitsRect(x1, y1, x2, y2, s)) return false;
  }
  return true;
}

export function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

// Smallest absolute difference between two angles, in radians.
export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
