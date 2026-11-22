// NIGHT VAULT — guards and cameras.
// A guard walks a patrol route and watches a cone in front of him. Stand
// in the cone and his suspicion fills; fill it and he chases the spot he
// last saw you. Lose him for a few seconds and he walks back to his route.
// A camera sweeps a beam; stand in the beam and it locks on, then calls
// the nearest guard to your position. Both are fair: their cones and beams
// are drawn, and cover blocks their sight.

import { GUARD, CAMERA, PLAYER } from './config.js';
import { hasLineOfSight, distance, angleDifference, moveCircle } from './level.js';

export function makeGuard(route, index) {
  const start = route.waypoints[0];
  return {
    name: route.name,
    x: start.x,
    y: start.y,
    angle: 0,
    waypoints: route.waypoints,
    mode: route.mode,
    waypointIndex: 1 % route.waypoints.length,
    waypointDirection: 1,
    state: 'patrol', // patrol | chase | return
    suspicion: 0,
    lastSeenX: start.x,
    lastSeenY: start.y,
    unseenSeconds: 0,
    phase: index * 1.7, // staggers guards so they do not move in lockstep
  };
}

export function makeCamera(mount) {
  return {
    x: mount.x,
    y: mount.y,
    restAngle: mount.restAngle,
    angle: mount.restAngle,
    sweepTime: 0, // accumulated time; the sweep runs on game time, not wall time
    lockSeconds: 0,
    locked: false,
    offlineSeconds: 0,
  };
}

// Can this guard see the thief right now? The thief must be inside the
// cone, inside range (sneaking shrinks it), and in open sight.
export function guardSeesThief(guard, thief, sneaking, vaultDoorLocked) {
  const range = GUARD.sightRange * (sneaking ? PLAYER.sneakSightFactor : 1);
  const d = distance(guard.x, guard.y, thief.x, thief.y);
  if (d > range) return false;
  const toThief = Math.atan2(thief.y - guard.y, thief.x - guard.x);
  if (Math.abs(angleDifference(toThief, guard.angle)) > GUARD.sightHalfAngle) return false;
  return hasLineOfSight(guard.x, guard.y, thief.x, thief.y, vaultDoorLocked);
}

// Can this camera see the thief? Same test, with the camera's own beam.
export function cameraSeesThief(camera, thief, vaultDoorLocked) {
  if (camera.offlineSeconds > 0) return false;
  const d = distance(camera.x, camera.y, thief.x, thief.y);
  if (d > CAMERA.range) return false;
  const toThief = Math.atan2(thief.y - camera.y, thief.x - camera.x);
  if (Math.abs(angleDifference(toThief, camera.angle)) > CAMERA.halfAngle) return false;
  return hasLineOfSight(camera.x, camera.y, thief.x, thief.y, vaultDoorLocked);
}

function stepToward(guard, tx, ty, speed, dt, vaultDoorLocked) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const d = Math.hypot(dx, dy);
  if (d < 1) return true;
  const step = Math.min(d, speed * dt);
  const nx = guard.x + (dx / d) * step;
  const ny = guard.y + (dy / d) * step;
  // Guards slide along walls the same way the thief does, so a patrol
  // never wedges itself into a corner.
  const moved = moveCircle(guard.x, guard.y, GUARD.radius, nx - guard.x, ny - guard.y, vaultDoorLocked);
  guard.x = moved.x;
  guard.y = moved.y;
  guard.angle = Math.atan2(dy, dx);
  return d - step < 2;
}

export function updateGuard(guard, thief, sneaking, dt, vaultDoorLocked, smoke) {
  const hiddenBySmoke = smoke && distance(thief.x, thief.y, smoke.x, smoke.y) < smoke.radius;
  const seen = !hiddenBySmoke && guardSeesThief(guard, thief, sneaking, vaultDoorLocked);

  if (seen) {
    guard.lastSeenX = thief.x;
    guard.lastSeenY = thief.y;
    guard.unseenSeconds = 0;
    const fill = dt / GUARD.suspectSeconds * (sneaking ? PLAYER.sneakFillFactor : 1);
    guard.suspicion = Math.min(1, guard.suspicion + fill);
    if (guard.suspicion >= 1 && guard.state !== 'chase') {
      guard.state = 'chase';
    }
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - dt * 0.5);
    if (guard.state === 'chase') {
      guard.unseenSeconds += dt;
      if (guard.unseenSeconds >= GUARD.loseSightSeconds) {
        guard.state = 'return';
      }
    }
  }

  if (guard.state === 'chase') {
    stepToward(guard, guard.lastSeenX, guard.lastSeenY, GUARD.chaseSpeed, dt, vaultDoorLocked);
    return distance(guard.x, guard.y, thief.x, thief.y) <= GUARD.catchDistance;
  }

  if (guard.state === 'return') {
    const home = guard.waypoints[guard.waypointIndex];
    const arrived = stepToward(guard, home.x, home.y, GUARD.returnSpeed, dt, vaultDoorLocked);
    if (arrived) guard.state = 'patrol';
    return false;
  }

  // Patrol: walk to the current waypoint, then pick the next one.
  const target = guard.waypoints[guard.waypointIndex];
  const arrived = stepToward(guard, target.x, target.y, GUARD.patrolSpeed, dt, vaultDoorLocked);
  if (arrived) {
    if (guard.mode === 'loop') {
      guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    } else {
      guard.waypointIndex += guard.waypointDirection;
      if (guard.waypointIndex >= guard.waypoints.length || guard.waypointIndex < 0) {
        guard.waypointDirection *= -1;
        guard.waypointIndex += guard.waypointDirection * 2;
      }
    }
  }
  return false;
}

// A camera sweeps its beam back and forth — until it sees the thief.
// Then it stops sweeping and tracks: the beam stays on the thief and the
// lock builds. Break line of sight (duck behind cover, or slip out of
// the beam) and the camera resumes its sweep and the lock bleeds off.
// Returns the guard to dispatch on a full lock, or null.
export function updateCamera(camera, thief, guards, dt, vaultDoorLocked, smoke) {
  if (camera.offlineSeconds > 0) {
    camera.offlineSeconds -= dt;
    camera.lockSeconds = 0;
    camera.locked = false;
    return null;
  }

  const hiddenBySmoke = smoke && distance(thief.x, thief.y, smoke.x, smoke.y) < smoke.radius;
  const seen = !hiddenBySmoke && cameraSeesThief(camera, thief, vaultDoorLocked);

  if (seen) {
    // Tracking: hold the beam on the thief and build the lock.
    camera.lockSeconds += dt;
    if (camera.lockSeconds >= CAMERA.lockSeconds && !camera.locked) {
      camera.locked = true;
      let nearest = null;
      let best = Infinity;
      for (const g of guards) {
        const d = distance(g.x, g.y, thief.x, thief.y);
        if (d < best) { best = d; nearest = g; }
      }
      if (nearest) {
        nearest.state = 'chase';
        nearest.lastSeenX = thief.x;
        nearest.lastSeenY = thief.y;
        nearest.unseenSeconds = 0;
        nearest.suspicion = 1;
        return nearest;
      }
    }
    return null;
  }

  // Not seen: the lock bleeds off and the sweep resumes.
  camera.lockSeconds = Math.max(0, camera.lockSeconds - dt);
  camera.locked = false;
  camera.sweepTime += dt;
  const sweep = Math.sin((camera.sweepTime / CAMERA.sweepSeconds) * Math.PI * 2);
  camera.angle = camera.restAngle + sweep * CAMERA.sweepHalfAngle;
  return null;
}
