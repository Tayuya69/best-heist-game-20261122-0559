// NEON VAULT — The Golden Chip Job: guards and cameras.
// A guard patrols its route, watches a cone, and chases the thief it has
// stared at long enough; a camera sweeps a beam and, once it has the thief
// in it, tracks them and calls the nearest guard. Both read their cones
// through the level's walls and cover, so the thief hides behind a slot
// machine the same way they hide behind a wall.

import { GUARD, CAMERA, ALARM } from './config.js';
import { sightBlocked } from './level.js';

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function makeGuards(routes) {
  return routes.map((r, i) => ({
    name: r.name,
    pts: r.pts,
    leg: 0,
    x: r.pts[0][0],
    y: r.pts[0][1],
    facing: 0,
    state: 'patrol', // patrol | chase | return
    suspicion: 0,
    unseen: 0,
    id: i,
  }));
}

export function makeCameras(defs) {
  return defs.map((d, i) => ({
    x: d.x,
    y: d.y,
    rest: d.rest,
    angle: d.rest,
    sweepTime: i * 1.1, // stagger the sweeps so they don't all swing together
    tracking: false,
    lock: 0,
    dark: 0, // EMP seconds left
    id: i,
  }));
}

// One guard step. Returns 'caught' when this guard touches the thief,
// 'chase' while it is actively hunting, 'seen' while it is filling
// suspicion, or null.
export function stepGuard(g, dt, thief, solids, onChase) {
  const range = GUARD.sightRange * (thief.sneaking ? 0.62 : 1);
  const d = dist(g.x, g.y, thief.x, thief.y);
  const inCone =
    d < range &&
    Math.abs(angleDiff(angleTo(g.x, g.y, thief.x, thief.y), g.facing)) <
      GUARD.sightHalfAngle &&
    !sightBlocked(g.x, g.y, thief.x, thief.y, solids) &&
    !thief.hidden;

  if (g.state === 'patrol') {
    if (inCone) {
      g.suspicion += dt / GUARD.suspectSeconds * (thief.sneaking ? 0.55 : 1);
      if (g.suspicion >= 1) {
        g.state = 'chase';
        g.unseen = 0;
        if (onChase) onChase(g);
      }
    } else {
      g.suspicion = Math.max(0, g.suspicion - dt / GUARD.suspectSeconds);
      walkPatrol(g, dt);
    }
  } else if (g.state === 'chase') {
    if (inCone) {
      g.unseen = 0;
    } else {
      g.unseen += dt;
      if (g.unseen > GUARD.loseSightSeconds) {
        g.state = 'return';
        g.suspicion = 0.4;
      }
    }
    // Chase the thief: run at them while seen, and keep running at the
    // spot the alarm came from while unseen, until the trail goes cold.
    moveToward(g, thief.x, thief.y, GUARD.chaseSpeed, dt, solids);
    g.facing = angleTo(g.x, g.y, thief.x, thief.y);
    if (d < GUARD.catchDistance) return 'caught';
    return 'chase';
  } else {
    // Return: walk back to the patrol route, then resume it.
    const home = g.pts[g.leg];
    if (dist(g.x, g.y, home[0], home[1]) < 8) {
      g.state = 'patrol';
      g.suspicion = 0;
    } else {
      moveToward(g, home[0], home[1], GUARD.returnSpeed, dt, solids);
      g.facing = angleTo(g.x, g.y, home[0], home[1]);
    }
  }
  return inCone ? 'seen' : null;
}

function walkPatrol(g, dt) {
  const target = g.pts[(g.leg + 1) % g.pts.length];
  const d = dist(g.x, g.y, target[0], target[1]);
  if (d < 6) {
    g.leg = (g.leg + 1) % g.pts.length;
    return;
  }
  const step = (GUARD.patrolSpeed * dt) / d;
  g.x += (target[0] - g.x) * step;
  g.y += (target[1] - g.y) * step;
  g.facing = angleTo(g.x, g.y, target[0], target[1]);
}

function moveToward(g, tx, ty, speed, dt, solids) {
  const d = dist(g.x, g.y, tx, ty);
  if (d < 1) return;
  const step = Math.min(d, speed * dt);
  const nx = g.x + ((tx - g.x) / d) * step;
  const ny = g.y + ((ty - g.y) / d) * step;
  // Guards slide around cover instead of getting stuck on a corner.
  const blocked = solids.some(
    (s) => nx > s.x - GUARD.radius && nx < s.x + s.w + GUARD.radius &&
      ny > s.y - GUARD.radius && ny < s.y + s.h + GUARD.radius,
  );
  if (!blocked) {
    g.x = nx;
    g.y = ny;
  } else {
    const tryX = solids.every(
      (s) => nx <= s.x - GUARD.radius || nx >= s.x + s.w + GUARD.radius ||
        g.y <= s.y - GUARD.radius || g.y >= s.y + s.h + GUARD.radius,
    );
    if (tryX) g.x = nx;
  }
}

// One camera step. Returns 'lock' when the beam has held the thief long
// enough to dispatch a guard, or null. A sweeping beam only builds lock
// while it is on the thief; once it has them it stops sweeping and tracks
// them, so the lock builds instead of decaying away.
export function stepCamera(c, dt, thief, solids, time) {
  if (c.dark > 0) {
    c.dark -= dt;
    c.lock = 0;
    c.tracking = false;
    return null;
  }
  const d = dist(c.x, c.y, thief.x, thief.y);
  const inBeam =
    d < CAMERA.range &&
    Math.abs(angleDiff(angleTo(c.x, c.y, thief.x, thief.y), c.angle)) <
      CAMERA.halfAngle &&
    !sightBlocked(c.x, c.y, thief.x, thief.y, solids) &&
    !thief.hidden;

  if (inBeam) {
    c.tracking = true;
    c.angle = angleTo(c.x, c.y, thief.x, thief.y);
    c.lock += dt / CAMERA.lockSeconds;
    if (c.lock >= 1) {
      c.lock = 0;
      return 'lock';
    }
  } else {
    c.tracking = false;
    c.lock = Math.max(0, c.lock - dt / CAMERA.lockSeconds);
    // Sweep on game time, not wall-clock time, so pausing the game
    // freezes the beams where they are.
    c.angle =
      c.rest + Math.sin((time + c.sweepTime) * (Math.PI * 2) / CAMERA.sweepSeconds) *
        CAMERA.sweepHalfAngle;
  }
  return null;
}
