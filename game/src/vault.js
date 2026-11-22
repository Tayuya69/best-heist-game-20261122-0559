// NEON VAULT — The Golden Chip Job: the vault's chip-sequence lock.
// The vault flashes a run of neon chips; the thief repeats it by pressing
// 1-4 or clicking the chips. Three rounds, each one chip longer. A wrong
// chip costs alarm and the round flashes again. This is pure logic — no
// canvas here — so a headless test can crack the whole vault.

import { LOCK, ALARM } from './config.js';

export const CHIP_COLORS = ['#ff2e88', '#2ee6ff', '#ffd23e', '#7dff5e'];
export const CHIP_KEYS = ['1', '2', '3', '4'];

export function makeLock() {
  return {
    state: 'idle', // idle | showing | input | done
    round: 0,
    sequence: [],
    showIndex: 0,
    showTimer: 0,
    lit: -1, // which chip is lit right now, -1 for none
    inputIndex: 0,
    alarmCost: 0, // accumulated miss cost for the game to collect
    message: '',
  };
}

export function startLock(lock, random = Math.random) {
  lock.round = 0;
  lock.message = '';
  nextRound(lock, random);
}

function nextRound(lock, random) {
  const len = LOCK.firstLength + lock.round;
  lock.sequence = Array.from({ length: len }, () => Math.floor(random() * 4));
  lock.showIndex = 0;
  lock.showTimer = LOCK.gapMs / 1000;
  lock.lit = -1;
  lock.inputIndex = 0;
  lock.state = 'showing';
}

// dt in seconds. Returns 'round' when a round is completed, 'done' when
// the whole lock opens, 'miss' on a wrong chip, or null.
export function stepLock(lock, dt) {
  if (lock.state !== 'showing') return null;
  lock.showTimer -= dt;
  if (lock.showTimer > 0) return null;
  if (lock.lit >= 0) {
    // The lit chip goes dark; pause before the next flash.
    lock.lit = -1;
    lock.showTimer = LOCK.gapMs / 1000;
    lock.showIndex += 1;
    if (lock.showIndex >= lock.sequence.length) {
      lock.state = 'input';
      lock.message = 'Repeat the sequence — 1-4 or click the chips';
    }
    return null;
  }
  // Light the next chip in the sequence.
  lock.lit = lock.sequence[lock.showIndex];
  lock.showTimer = LOCK.flashMs / 1000;
  return null;
}

export function pressChip(lock, index, random = Math.random) {
  if (lock.state !== 'input') return null;
  if (index === lock.sequence[lock.inputIndex]) {
    lock.inputIndex += 1;
    if (lock.inputIndex >= lock.sequence.length) {
      lock.round += 1;
      if (lock.round >= LOCK.rounds) {
        lock.state = 'done';
        lock.message = 'The vault clicks open.';
        return 'done';
      }
      nextRound(lock, random);
      lock.message = `Round ${lock.round + 1} — watch the chips`;
      return 'round';
    }
    return 'ok';
  }
  // Wrong chip: the lock buzzes, the alarm climbs, and the round flashes
  // again from the start.
  lock.alarmCost += ALARM.lockMissCost;
  lock.message = 'Wrong chip! The lock flashes the sequence again.';
  nextRound(lock, random);
  return 'miss';
}
