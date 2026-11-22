// NIGHT VAULT — the thief.
// Movement is WASD or arrows, Shift to sneak, click to walk somewhere.
// Two tools, each with a real cost: a smoke bomb that blinds the room
// (but trips a sensor) and an EMP that kills the cameras (but trips a
// tamper alarm). Tools are scarce on purpose — a heist is about choosing
// when to spend them.

import { PLAYER, TOOLS, ALARM } from './config.js';
import { moveCircle, distance } from './level.js';

export function makePlayer(x, y) {
  return {
    x, y,
    angle: -Math.PI / 2, // facing up the rooftop when the job starts
    sneaking: false,
    moving: false,
    clickTarget: null,
    smokeCharges: TOOLS.smokeCharges,
    empCharges: TOOLS.empCharges,
    stepSound: 0, // seconds until the next footstep tick
  };
}

// Read the held keys and move the thief. Returns the direction the thief
// is facing, so the renderer and the guards' sight agree on it.
export function updatePlayer(player, keys, dt, vaultDoorLocked) {
  let dx = 0;
  let dy = 0;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;

  if (dx === 0 && dy === 0 && player.clickTarget) {
    const tx = player.clickTarget.x - player.x;
    const ty = player.clickTarget.y - player.y;
    const d = Math.hypot(tx, ty);
    if (d < 8) {
      player.clickTarget = null;
    } else {
      dx = tx / d;
      dy = ty / d;
    }
  }

  player.moving = dx !== 0 || dy !== 0;
  player.sneaking = !!keys.sneak && player.moving;
  if (!player.moving) return;

  const len = Math.hypot(dx, dy);
  const speed = player.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  const moved = moveCircle(
    player.x, player.y, PLAYER.radius,
    (dx / len) * speed * dt, (dy / len) * speed * dt,
    vaultDoorLocked,
  );
  player.x = moved.x;
  player.y = moved.y;
  player.angle = Math.atan2(dy, dx);

  player.stepSound -= dt;
}

// Throw a smoke bomb at the thief's feet. The cloud hides the thief from
// guards and cameras, but the sensor it trips feeds the alarm.
export function useSmoke(player, game) {
  if (player.smokeCharges <= 0) return false;
  if (game.smoke) return false; // one cloud at a time
  player.smokeCharges -= 1;
  game.smoke = { x: player.x, y: player.y, radius: TOOLS.smokeRadius, seconds: TOOLS.smokeSeconds };
  game.alarm = Math.min(ALARM.max, game.alarm + ALARM.toolSmokeCost);
  game.events.push('smoke');
  return true;
}

// Fire the EMP. Every camera goes dark for a while, but the tamper sensor
// feeds the alarm.
export function useEmp(player, game) {
  if (player.empCharges <= 0) return false;
  player.empCharges -= 1;
  for (const camera of game.cameras) {
    camera.offlineSeconds = TOOLS.empSeconds;
    camera.lockSeconds = 0;
    camera.locked = false;
  }
  game.alarm = Math.min(ALARM.max, game.alarm + ALARM.toolEmpCost);
  game.events.push('emp');
  return true;
}

// Is the thief standing inside a smoke cloud? Guards and cameras cannot
// see through it.
export function inSmoke(player, smoke) {
  return !!smoke && distance(player.x, player.y, smoke.x, smoke.y) < smoke.radius;
}
