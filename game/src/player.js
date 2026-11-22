// player.js — the thief: WASD/arrows, Shift to sneak, click to walk there.
// Wall sliding comes free from resolving one axis at a time.

import { PLAYER } from './config.js';
import { clampCircleToHall, resolveCircleVsRects } from './geometry.js';
import { SOLIDS } from './level.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = PLAYER.radius;
    this.facing = -Math.PI / 2; // starts facing up the hall
    this.moving = false;
    this.sneaking = false;
    this.running = false;
    this.clickTarget = null; // {x, y} while a click-to-move is active
    this.stepClock = 0; // drives the footstep sound
    this.stepped = false; // set true on a step, read by the audio hook
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.facing = -Math.PI / 2;
    this.moving = false;
    this.sneaking = false;
    this.clickTarget = null;
    this.stepClock = 0;
  }

  update(dt, input) {
    let dx = 0;
    let dy = 0;
    if (input.isDown('ArrowUp') || input.isDown('KeyW')) dy -= 1;
    if (input.isDown('ArrowDown') || input.isDown('KeyS')) dy += 1;
    if (input.isDown('ArrowLeft') || input.isDown('KeyA')) dx -= 1;
    if (input.isDown('ArrowRight') || input.isDown('KeyD')) dx += 1;

    this.sneaking = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
    const keyboardMoving = dx !== 0 || dy !== 0;
    if (keyboardMoving) this.clickTarget = null; // keys override a click walk

    if (!keyboardMoving && this.clickTarget) {
      const tx = this.clickTarget.x - this.x;
      const ty = this.clickTarget.y - this.y;
      const dist = Math.hypot(tx, ty);
      if (dist < 8) {
        this.clickTarget = null;
      } else {
        dx = tx / dist;
        dy = ty / dist;
      }
    }

    const len = Math.hypot(dx, dy);
    this.moving = len > 0;
    this.running = this.moving && !this.sneaking;
    if (!this.moving) return;

    const speed = this.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    const vx = (dx / len) * speed * dt;
    const vy = (dy / len) * speed * dt;
    this.facing = Math.atan2(dy, dx);

    // Move one axis at a time so the thief slides along walls instead of sticking.
    this.x += vx;
    resolveCircleVsRects(this, SOLIDS);
    clampCircleToHall(this, { x: 24, y: 24, width: 912, height: 552 });
    this.y += vy;
    resolveCircleVsRects(this, SOLIDS);
    clampCircleToHall(this, { x: 24, y: 24, width: 912, height: 552 });

    // Footstep tick: faster while running, slower while sneaking.
    this.stepClock += dt * (this.sneaking ? 0.7 : 1.4);
    if (this.stepClock >= 0.34) {
      this.stepClock = 0;
      this.stepped = true;
    }
  }
}
