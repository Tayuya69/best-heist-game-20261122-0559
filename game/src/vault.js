// NIGHT VAULT — the vault dial.
// The vault does not open for a key: it opens for a steady hand. A pointer
// spins around the dial and three tumblers wait, each with a green target
// arc. Press the action key while the pointer sits inside the arc and the
// tumbler locks with a click; press outside it and the vault buzzes, the
// alarm jumps, and the tumbler stays put. Each tumbler spins faster than
// the last. Three locks and the vault swings open on the Aurum Diamond.

import { DIAL, ALARM } from './config.js';
import { angleDifference } from './level.js';

export function makeDial() {
  return {
    active: false,
    pointer: 0, // current pointer angle, radians
    tumbler: 0, // which tumbler is being cracked (0..2)
    targets: [0, 0, 0], // target arc centre per tumbler
    locked: [false, false, false],
    done: false,
    flash: 0, // seconds of red flash after a miss
  };
}

export function openDial(dial) {
  dial.active = true;
  dial.pointer = 0;
  dial.tumbler = 0;
  dial.locked = [false, false, false];
  dial.done = false;
  dial.flash = 0;
  dial.targets = [
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
  ];
}

export function closeDial(dial) {
  dial.active = false;
}

// Spin the pointer. The world is paused while the dial is open, so the
// crack is a pure timing test — the tension is the alarm a miss costs.
export function updateDial(dial, dt) {
  if (!dial.active || dial.done) return;
  dial.pointer += DIAL.speeds[dial.tumbler] * dt;
  if (dial.pointer > Math.PI * 2) dial.pointer -= Math.PI * 2;
  if (dial.flash > 0) dial.flash -= dt;
}

// Try to lock the current tumbler. Returns 'lock', 'miss' or 'open'.
export function lockTumbler(dial, game) {
  if (!dial.active || dial.done) return null;
  const target = dial.targets[dial.tumbler];
  const off = Math.abs(angleDifference(dial.pointer, target));
  if (off <= DIAL.targetArc / 2) {
    dial.locked[dial.tumbler] = true;
    dial.tumbler += 1;
    if (dial.tumbler >= DIAL.tumblers) {
      dial.done = true;
      dial.active = false;
      return 'open';
    }
    return 'lock';
  }
  dial.flash = 0.4;
  game.alarm = Math.min(ALARM.max, game.alarm + ALARM.dialMissCost);
  return 'miss';
}
