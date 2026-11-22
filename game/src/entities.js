// Sapphire Heist v2 — the actors: the thief, four patrolling guards with
// vision cones and suspicion, and three sweeping security cameras.
// Each actor only knows its own update rules; the game logic in logic.js
// wires them together (alarm, catches, objectives).
import { CFG } from './config.js';
import { angleDiff, dist, hasLineOfSight, inCone, moveCircle } from './geo.js';

export class Player {
  constructor(spawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.radius = CFG.playerRadius;
    this.facing = -Math.PI / 2;
    this.sneaking = false;
    this.moving = false;
    this.hearts = CFG.hearts;
    this.invuln = 0;
    this.hasKeycard = false;
    this.hasSapphire = false;
    this.clickTarget = null;
    this.stepPhase = 0;
  }

  update(dt, input, solids) {
    this.invuln = Math.max(0, this.invuln - dt);
    this.sneaking = !!input.sneak;
    let dx = 0;
    let dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (dx === 0 && dy === 0 && this.clickTarget) {
      const d = dist(this.x, this.y, this.clickTarget.x, this.clickTarget.y);
      if (d < 6) {
        this.clickTarget = null;
      } else {
        dx = (this.clickTarget.x - this.x) / d;
        dy = (this.clickTarget.y - this.y) / d;
      }
    }
    const len = Math.hypot(dx, dy);
    this.moving = len > 0;
    if (this.moving) {
      const speed = this.sneaking ? CFG.sneakSpeed : CFG.walkSpeed;
      const nx = (dx / len) * speed * dt;
      const ny = (dy / len) * speed * dt;
      this.facing = Math.atan2(ny, nx);
      moveCircle(this, this.radius, nx, ny, solids);
      this.stepPhase += dt * (this.sneaking ? 7 : 11);
    }
  }
}

export class Guard {
  constructor(def) {
    this.name = def.name;
    this.color = def.color;
    this.waypoints = def.waypoints;
    this.wp = 0;
    this.dir = 1;
    this.x = def.waypoints[0][0];
    this.y = def.waypoints[0][1];
    this.radius = CFG.guardRadius;
    this.facing = Math.PI / 2;
    this.state = 'patrol'; // patrol | chase | return
    this.suspicion = 0;
    this.lastSeen = null;
    this.memory = 0;
    this.wait = 0;
    this.seesPlayer = false;
  }

  // Returns 'alerted' the moment suspicion fills (the caller raises the alarm).
  update(dt, player, solids) {
    const range = CFG.guardVisionRange * (player.sneaking ? CFG.sneakDetectMul : 1);
    const gain = CFG.suspicionPerSec * (player.sneaking ? CFG.sneakGainMul : 1);
    this.seesPlayer = inCone(this.x, this.y, this.facing, range,
      CFG.guardVisionHalfAngle, player.x, player.y, solids);
    let alerted = false;
    if (this.seesPlayer) {
      this.suspicion = Math.min(100, this.suspicion + gain * dt);
      this.lastSeen = { x: player.x, y: player.y };
      this.memory = CFG.chaseMemory;
      if (this.suspicion >= 100 && this.state !== 'chase') {
        this.state = 'chase';
        alerted = true;
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - CFG.suspicionDecay * dt);
    }

    if (this.state === 'chase') {
      this.memory -= dt;
      const target = this.lastSeen || { x: this.x, y: this.y };
      this.moveToward(dt, target.x, target.y, CFG.guardChaseSpeed, solids);
      if (this.memory <= 0) this.state = 'return';
    } else if (this.state === 'return') {
      // Walk back to the nearest waypoint, then resume the patrol.
      let best = 0;
      let bestD = Infinity;
      this.waypoints.forEach((w, i) => {
        const d = dist(this.x, this.y, w[0], w[1]);
        if (d < bestD) { bestD = d; best = i; }
      });
      this.wp = best;
      const [wx, wy] = this.waypoints[this.wp];
      const arrived = this.moveToward(dt, wx, wy, CFG.guardPatrolSpeed, solids);
      if (arrived) this.state = 'patrol';
    } else {
      if (this.wait > 0) {
        this.wait -= dt;
      } else {
        const [wx, wy] = this.waypoints[this.wp];
        const arrived = this.moveToward(dt, wx, wy, CFG.guardPatrolSpeed, solids);
        if (arrived) {
          this.wait = 1.2;
          this.wp += this.dir;
          if (this.wp >= this.waypoints.length) {
            this.wp = this.waypoints.length - 2;
            this.dir = -1;
          } else if (this.wp < 0) {
            this.wp = 1;
            this.dir = 1;
          }
        }
      }
    }
    return alerted;
  }

  // Step toward (tx, ty); returns true when close enough to count as arrived.
  moveToward(dt, tx, ty, speed, solids) {
    const d = dist(this.x, this.y, tx, ty);
    if (d < 4) return true;
    const step = Math.min(d, speed * dt);
    const nx = ((tx - this.x) / d) * step;
    const ny = ((ty - this.y) / d) * step;
    const target = Math.atan2(ny, nx);
    let turn = angleDiff(target, this.facing);
    const maxTurn = 6 * dt;
    this.facing += Math.max(-maxTurn, Math.min(maxTurn, turn));
    moveCircle(this, this.radius, nx, ny, solids);
    return false;
  }
}

export class Camera {
  constructor(def) {
    this.id = def.id;
    this.x = def.x;
    this.y = def.y;
    this.base = def.base;
    this.sweep = def.sweep;
    this.phase = Math.random() * Math.PI * 2;
    this.angle = def.base;
    this.locking = false;
  }

  update(dt, time, player, solids, offline) {
    this.phase += dt * CFG.cameraSweepSpeed;
    this.angle = this.base + Math.sin(this.phase) * this.sweep;
    if (offline) {
      this.locking = false;
      return;
    }
    this.locking = inCone(this.x, this.y, this.angle, CFG.cameraRange,
      CFG.cameraHalfAngle, player.x, player.y, solids);
  }
}

// The sapphire case and the locked vault door both block movement while shut.
export function buildSolids(map, vaultOpen) {
  const solids = [...map.walls, ...map.obstacles, map.sapphireCase];
  if (!vaultOpen) {
    const door = map.doors.find((d) => d.id === 'vaultDoor');
    solids.push({ x: door.x, y: door.y, w: door.w, h: door.h });
  }
  return solids;
}

// Vision blockers: walls and furniture (the case is low glass; it does not
// block sight, so it stays out of this list).
export function buildSightBlockers(map) {
  return [...map.walls, ...map.obstacles];
}
