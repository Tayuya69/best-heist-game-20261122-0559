// NEON VAULT — The Golden Chip Job: the thief.
// WASD/arrows to walk, Shift to sneak, click to walk there, E to use
// whatever is in front of them. Smoke (Q) and EMP (F) are tools at a cost:
// each one buys safety with alarm. The thief hides in a smoke cloud.

import { PLAYER, TOOLS } from './config.js';
import { moveCircle } from './level.js';

export function makePlayer(entry) {
  return {
    x: entry.x,
    y: entry.y,
    sneaking: false,
    hidden: false, // standing inside a smoke cloud
    smokeLeft: TOOLS.smokeCharges,
    empLeft: TOOLS.empCharges,
    clickTarget: null,
    facing: -Math.PI / 2,
    bob: 0,
  };
}

// keys is a Set of currently-held key names (lowercase). Returns nothing;
// the game reads player.x / player.y after the call.
export function stepPlayer(p, dt, keys, solids) {
  let mx = 0;
  let my = 0;
  if (keys.has('a') || keys.has('arrowleft')) mx -= 1;
  if (keys.has('d') || keys.has('arrowright')) mx += 1;
  if (keys.has('w') || keys.has('arrowup')) my -= 1;
  if (keys.has('s') || keys.has('arrowdown')) my += 1;

  if (mx === 0 && my === 0 && p.clickTarget) {
    const dx = p.clickTarget.x - p.x;
    const dy = p.clickTarget.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) {
      p.clickTarget = null;
    } else {
      mx = dx / d;
      my = dy / d;
    }
  }

  p.sneaking = keys.has('shift');
  const speed = p.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my);
    const moved = moveCircle(
      p.x, p.y, PLAYER.radius,
      (mx / len) * speed * dt, (my / len) * speed * dt, solids,
    );
    p.x = moved.x;
    p.y = moved.y;
    p.facing = Math.atan2(my, mx);
    p.bob += dt * (p.sneaking ? 6 : 11);
  }
}

export function useSmoke(p, smokes) {
  if (p.smokeLeft <= 0) return false;
  p.smokeLeft -= 1;
  smokes.push({ x: p.x, y: p.y, r: TOOLS.smokeRadius, left: TOOLS.smokeSeconds });
  return true;
}

export function useEmp(p, cameras) {
  if (p.empLeft <= 0) return false;
  p.empLeft -= 1;
  for (const c of cameras) c.dark = TOOLS.empSeconds;
  return true;
}

// The thief is hidden while any live smoke cloud covers them.
export function updateHidden(p, smokes) {
  p.hidden = smokes.some((s) => Math.hypot(p.x - s.x, p.y - s.y) < s.r);
}
