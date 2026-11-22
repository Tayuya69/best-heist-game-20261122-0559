// guards.js — patrol guards with vision cones, suspicion and hunts.
// A guard patrols a loop, pauses at each waypoint, and watches a cone ahead.
// Standing inside a lit cone fills suspicion; a full meter means the guard
// raises the alarm and hunts the last place he saw the thief. Break line of
// sight and the suspicion drains; stay unseen through a hunt and he gives up.

import { GUARD } from './config.js';
import { angleDifference, distance, pointInCone, segmentBlocked } from './geometry.js';
import { SOLIDS } from './level.js';

export const GUARD_STATE = {
  PATROL: 'patrol',
  SUSPICIOUS: 'suspicious', // saw something, turning to look
  HUNT: 'hunt', // knows where the thief was, moving in
  RETURN: 'return', // giving up, walking back to the route
};

export class Guard {
  constructor(route) {
    this.name = route.name;
    this.color = route.color;
    this.route = route.waypoints;
    this.waypointIndex = 0;
    this.x = route.waypoints[0].x;
    this.y = route.waypoints[0].y;
    this.heading = Math.PI / 2;
    this.state = GUARD_STATE.PATROL;
    this.suspicion = 0;
    this.waitTimer = 0;
    this.huntTimer = 0;
    this.lastSeen = null; // {x, y} where the thief was last spotted
    this.seesThief = false;
    this.alertedThisHunt = false;
  }

  reset() {
    this.waypointIndex = 0;
    this.x = this.route[0].x;
    this.y = this.route[0].y;
    this.heading = Math.PI / 2;
    this.state = GUARD_STATE.PATROL;
    this.suspicion = 0;
    this.waitTimer = 0;
    this.huntTimer = 0;
    this.lastSeen = null;
    this.seesThief = false;
  }

  // Can this guard see the thief right now? Cone + range + line of sight.
  canSee(player) {
    if (distance(this.x, this.y, player.x, player.y) > GUARD.noticeDistance) return false;
    if (!pointInCone(player.x, player.y, this.x, this.y, this.heading, GUARD.visionFov, GUARD.visionRange)) {
      return false;
    }
    return !segmentBlocked(this.x, this.y, player.x, player.y, SOLIDS);
  }

  // One tick. Returns events the game loop turns into alarm/sound/lose.
  // events: { alerted: bool, caught: bool }
  update(dt, player) {
    const events = { alerted: false, caught: false };
    this.seesThief = this.canSee(player);

    if (this.seesThief) {
      this.lastSeen = { x: player.x, y: player.y };
      let rate = GUARD.suspicionPerSecond;
      if (player.sneaking) rate *= GUARD.sneakSuspicionFactor;
      else if (player.running) rate *= GUARD.runSuspicionFactor;
      // Closer is scarier: suspicion fills faster under the guard's nose.
      const d = distance(this.x, this.y, player.x, player.y);
      if (d < 90) rate *= 1.5;
      this.suspicion = Math.min(GUARD.alertAt, this.suspicion + rate * dt);
      if (this.suspicion >= GUARD.alertAt && this.state !== GUARD_STATE.HUNT) {
        this.state = GUARD_STATE.HUNT;
        this.huntTimer = GUARD.huntSeconds;
        this.alertedThisHunt = true;
        events.alerted = true;
      }
      if (this.state === GUARD_STATE.PATROL) this.state = GUARD_STATE.SUSPICIOUS;
    } else {
      this.suspicion = Math.max(0, this.suspicion - GUARD.suspicionDecayPerSecond * dt);
      if (this.state === GUARD_STATE.SUSPICIOUS && this.suspicion === 0) {
        this.state = GUARD_STATE.PATROL;
      }
    }

    // A guard who touches the thief catches him on the spot.
    if (distance(this.x, this.y, player.x, player.y) <= GUARD.catchRadius + player.radius - 1) {
      events.caught = true;
      return events;
    }

    switch (this.state) {
      case GUARD_STATE.PATROL:
      case GUARD_STATE.RETURN:
        this.patrolStep(dt);
        break;
      case GUARD_STATE.SUSPICIOUS:
        this.turnToward(player.x, player.y, dt, 3.2);
        break;
      case GUARD_STATE.HUNT:
        this.huntStep(dt);
        break;
      default:
        break;
    }
    return events;
  }

  patrolStep(dt) {
    if (this.waitTimer > 0) {
      this.waitTimer -= dt;
      // Look around while waiting: a slow scan of the room.
      this.heading += dt * 0.7;
      return;
    }
    const target = this.route[this.waypointIndex];
    const speed = this.state === GUARD_STATE.RETURN ? GUARD.returnSpeed : GUARD.patrolSpeed;
    const arrived = this.moveToward(target.x, target.y, speed * dt);
    if (arrived) {
      this.waypointIndex = (this.waypointIndex + 1) % this.route.length;
      this.waitTimer = GUARD.waitAtWaypointSeconds;
      if (this.state === GUARD_STATE.RETURN && this.nearestWaypointIsCurrent()) {
        this.state = GUARD_STATE.PATROL;
      }
    }
  }

  huntStep(dt) {
    this.huntTimer -= dt;
    if (!this.lastSeen || this.huntTimer <= 0) {
      this.state = GUARD_STATE.RETURN;
      this.waypointIndex = this.nearestWaypointIndex();
      this.suspicion = Math.max(0, this.suspicion - 40);
      return;
    }
    const arrived = this.moveToward(this.lastSeen.x, this.lastSeen.y, GUARD.huntSpeed * dt);
    if (arrived) {
      // Reached the last-seen spot and the thief is gone: look around, then give up.
      this.heading += dt * 2.2;
      this.huntTimer -= dt * 1.5;
    }
  }

  nearestWaypointIndex() {
    let best = 0;
    let bestDist = Infinity;
    this.route.forEach((wp, i) => {
      const d = distance(this.x, this.y, wp.x, wp.y);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  }

  nearestWaypointIsCurrent() {
    return this.nearestWaypointIndex() === this.waypointIndex;
  }

  // Move toward a point, turning the heading to face it. True when arrived.
  moveToward(tx, ty, step) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= step) {
      this.x = tx;
      this.y = ty;
      return true;
    }
    const targetHeading = Math.atan2(dy, dx);
    this.turnToward(tx, ty, step / GUARD.patrolSpeed, 6);
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    this.heading = targetHeading;
    return false;
  }

  // Turn the heading toward a point, capped at turnSpeed radians per second.
  turnToward(tx, ty, dt, turnSpeed) {
    const target = Math.atan2(ty - this.y, tx - this.x);
    const diff = angleDifference(target, this.heading);
    if (diff < 0.01) {
      this.heading = target;
      return;
    }
    const cross = Math.sin(target - this.heading);
    const step = Math.min(diff, turnSpeed * dt);
    this.heading += cross >= 0 ? step : -step;
  }
}
