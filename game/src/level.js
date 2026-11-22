// level.js — the vault hall: walls, cover, loot, patrol routes, cameras, exit.
// One room the thief must cross: a red carpet runs from the service door (spawn)
// past the sapphire case to the green EXIT. Display cases, desks, pillars and the
// safe wall break line of sight, so there is always a route around a cone.

import { HALL } from './config.js';

export const SPAWN = { x: 96, y: 512 };

export const EXIT_DOOR = { x: 852, y: 492, width: 60, height: 60 };

// Cover rectangles: solid for movement AND for line of sight.
export const COVER = [
  // Central sapphire case (the loot sits on top of it; the case itself blocks).
  { x: 428, y: 258, width: 104, height: 84, kind: 'case', label: 'Sapphire case' },
  // Side display cases holding the gold bars.
  { x: 150, y: 130, width: 96, height: 64, kind: 'case', label: 'Gold case west' },
  { x: 714, y: 130, width: 96, height: 64, kind: 'case', label: 'Gold case east' },
  // Desks: the intel file lies on the west desk.
  { x: 150, y: 380, width: 120, height: 52, kind: 'desk', label: 'Curator desk' },
  { x: 690, y: 380, width: 120, height: 52, kind: 'desk', label: 'Ledger desk' },
  // Pillars mid-hall: the only tall cover on the carpet line.
  { x: 330, y: 130, width: 34, height: 34, kind: 'pillar', label: 'Pillar north' },
  { x: 596, y: 412, width: 34, height: 34, kind: 'pillar', label: 'Pillar south' },
  // Safe wall along the top: a row of vault doors, solid.
  { x: 330, y: 40, width: 300, height: 40, kind: 'safe', label: 'Safe wall' },
];

// Everything solid: cover plus the four outer walls (as rects, for LOS/collision).
export const SOLIDS = [
  ...COVER,
  { x: 0, y: 0, width: 960, height: 24, kind: 'wall' },
  { x: 0, y: 576, width: 960, height: 24, kind: 'wall' },
  { x: 0, y: 0, width: 24, height: 600, kind: 'wall' },
  { x: 936, y: 0, width: 24, height: 600, kind: 'wall' },
];

// Loot: the sapphire is the job (required); gold and intel are optional score.
export const LOOT_SPOTS = [
  { id: 'sapphire', kind: 'sapphire', x: 480, y: 240, label: 'Star Sapphire' },
  { id: 'gold-west', kind: 'goldBar', x: 198, y: 112, label: 'Gold bar' },
  { id: 'gold-east', kind: 'goldBar', x: 762, y: 112, label: 'Gold bar' },
  { id: 'intel', kind: 'intel', x: 210, y: 368, label: 'Vault ledger' },
];

// Patrol routes: each guard walks a loop and pauses at every waypoint.
// Vic sweeps the west wing, Mara the carpet line, Odo the east wing.
export const GUARD_ROUTES = [
  {
    name: 'Vic',
    color: '#7fa3d8',
    waypoints: [
      { x: 130, y: 250 },
      { x: 130, y: 470 },
      { x: 330, y: 470 },
      { x: 330, y: 250 },
    ],
  },
  {
    name: 'Mara',
    color: '#d8a37f',
    waypoints: [
      { x: 380, y: 470 },
      { x: 580, y: 470 },
      { x: 580, y: 210 },
      { x: 380, y: 210 },
    ],
  },
  {
    name: 'Odo',
    color: '#9fd8a3',
    waypoints: [
      { x: 830, y: 250 },
      { x: 830, y: 470 },
      { x: 660, y: 470 },
      { x: 660, y: 250 },
    ],
  },
];

// Wall cameras: fixed mounts that sweep a cone across their wing.
export const CAMERA_MOUNTS = [
  {
    name: 'Cam A',
    x: 480,
    y: 96,
    baseAngle: Math.PI / 2, // looks down the hall, under the safe wall
    phase: 0,
  },
  {
    name: 'Cam B',
    x: 930,
    y: 300,
    baseAngle: Math.PI, // looks left across the east wing
    phase: 1.7,
  },
];

// Red carpet runner: spawn -> sapphire case -> exit (purely visual).
export const CARPET = { x: 72, y: 470, width: 816, height: 74 };

export function hallContains(x, y) {
  return x >= HALL.x && x <= HALL.x + HALL.width && y >= HALL.y && y <= HALL.y + HALL.height;
}
