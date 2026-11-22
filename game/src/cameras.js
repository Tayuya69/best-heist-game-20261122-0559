// cameras.js — wall cameras that sweep a cone across their wing.
// A camera never moves, but its lens swings: crossing its beam while it
// points at you feeds the alarm meter. The sweep is a sine, so the timing
// is learnable — wait for the lens to swing away, then cross.

import { CAMERA } from './config.js';
import { pointInCone, segmentBlocked } from './geometry.js';
import { SOLIDS } from './level.js';

export class Camera {
  constructor(mount) {
    this.name = mount.name;
    this.x = mount.x;
    this.y = mount.y;
    this.baseAngle = mount.baseAngle;
    this.phase = mount.phase;
    this.clock = 0;
    this.angle = mount.baseAngle;
    this.seesThief = false;
    this.locked = false; // lit up red while the thief is in the beam
  }

  reset() {
    this.clock = 0;
    this.angle = this.baseAngle;
    this.seesThief = false;
    this.locked = false;
  }

  update(dt, player) {
    this.clock += dt;
    this.angle =
      this.baseAngle + Math.sin(this.clock * CAMERA.sweepSpeed + this.phase) * CAMERA.sweepRadians;
    const inCone = pointInCone(
      player.x,
      player.y,
      this.x,
      this.y,
      this.angle,
      CAMERA.fov,
      CAMERA.range,
    );
    this.seesThief =
      inCone && !segmentBlocked(this.x, this.y, player.x, player.y, SOLIDS);
    this.locked = this.seesThief;
  }
}
