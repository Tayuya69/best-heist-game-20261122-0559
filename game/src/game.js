// NEON VAULT — The Golden Chip Job: the game itself.
// The state machine: title, playing, the vault lock modal, pause, and the
// four ends (caught, locked down, dawn, getaway). It owns the objective
// chain — keycard, then cage alarm, then the vault lock, then the jackpot,
// then the garage — plus the alarm meter, the clock, the lives and the
// score. Rendering and sound live in their own files.

import { ALARM, TIMER_SECONDS, LIVES, LOOT, WORLD } from './config.js';
import {
  ENTRY, ESCAPE, WALLS, COVER, DOORS, KEYCARD, CAGE_PANEL, VAULT, LOOT as LEVEL_LOOT,
  GUARD_ROUTES, CAMERAS, solidRects, circleHitsRect,
} from './level.js';
import { makeGuards, makeCameras, stepGuard, stepCamera } from './guards.js';
import { makePlayer, stepPlayer, useSmoke, useEmp, updateHidden } from './player.js';
import { makeLock, startLock, stepLock, pressChip } from './vault.js';

export const OBJECTIVES = [
  'Lift the VIP keycard from the lounge',
  'Kill the cage alarm at the cashier',
  'Crack the vault lock — repeat the chip sequence',
  'Grab the jackpot and reach the garage',
];

export function makeGame() {
  return {
    state: 'title', // title | playing | lock | paused | caught | lockdown | dawn | win
    time: 0,
    timeLeft: TIMER_SECONDS,
    alarm: 0,
    maxAlarm: 0,
    lives: LIVES,
    score: 0,
    loot: 0,
    objective: 0,
    hasKeycard: false,
    cageOff: false,
    jackpot: false,
    player: makePlayer(ENTRY),
    guards: makeGuards(GUARD_ROUTES),
    cameras: makeCameras(CAMERAS),
    lock: makeLock(),
    smokes: [],
    particles: [],
    shake: 0,
    flash: 0,
    message: '',
    messageTimer: 0,
    respawnGrace: 0,
    endStats: null,
  };
}

export function resetGame(g) {
  const fresh = makeGame();
  Object.assign(g, fresh);
  g.state = 'playing';
  KEYCARD.taken = false;
  CAGE_PANEL.disabled = false;
  VAULT.opened = false;
  for (const l of LEVEL_LOOT) l.taken = false;
  for (const d of DOORS) d.locked = true;
}

export function startGame(g) {
  resetGame(g);
}

function solids() {
  return solidRects(DOORS);
}

function nearestInteractable(g) {
  const p = g.player;
  const near = (x, y, r = 34) => Math.hypot(p.x - x, p.y - y) < r;
  if (!g.hasKeycard && !KEYCARD.taken && near(KEYCARD.x, KEYCARD.y)) {
    return { kind: 'keycard', label: 'Take the VIP keycard' };
  }
  if (g.hasKeycard && !g.cageOff && !CAGE_PANEL.disabled && near(CAGE_PANEL.x, CAGE_PANEL.y)) {
    return { kind: 'panel', label: 'Kill the cage alarm' };
  }
  if (g.hasKeycard && g.cageOff && !VAULT.opened && near(VAULT.x, VAULT.y)) {
    return { kind: 'vault', label: 'Crack the vault lock' };
  }
  return null;
}

export function interact(g) {
  const it = nearestInteractable(g);
  if (!it) return;
  if (it.kind === 'keycard') {
    KEYCARD.taken = true;
    g.hasKeycard = true;
    g.objective = 1;
    g.message = 'VIP keycard lifted — the vault door will open for you.';
    g.messageTimer = 3;
    burst(g, KEYCARD.x, KEYCARD.y, '#2ee6ff');
  } else if (it.kind === 'panel') {
    CAGE_PANEL.disabled = true;
    g.cageOff = true;
    g.objective = 2;
    g.message = 'Cage alarm killed — the vault lock is live.';
    g.messageTimer = 3;
    burst(g, CAGE_PANEL.x, CAGE_PANEL.y, '#7dff5e');
  } else if (it.kind === 'vault') {
    g.state = 'lock';
    startLock(g.lock);
  }
}

function burst(g, x, y, color) {
  for (let i = 0; i < 18; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 40 + Math.random() * 120;
    g.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, left: 0.6, color });
  }
}

function addAlarm(g, amount) {
  g.alarm = Math.min(ALARM.max, g.alarm + amount);
  g.maxAlarm = Math.max(g.maxAlarm, g.alarm);
  if (g.alarm >= ALARM.max) endGame(g, 'lockdown');
}

function endGame(g, kind) {
  g.state = kind;
  const timeBonus = Math.max(0, Math.floor(g.timeLeft)) * LOOT.timeBonusPerSecond;
  const ghost = g.maxAlarm <= ALARM.ghostCeiling ? LOOT.ghostBonus : 0;
  g.endStats = {
    loot: g.loot,
    timeBonus: kind === 'win' ? timeBonus : 0,
    ghost,
    total: g.loot + (kind === 'win' ? timeBonus : 0) + (kind === 'win' ? ghost : 0),
  };
  g.score = g.endStats.total;
}

function caught(g) {
  g.lives -= 1;
  addAlarm(g, ALARM.catchPenalty);
  g.shake = 0.5;
  g.flash = 0.4;
  burst(g, g.player.x, g.player.y, '#ff3c3c');
  if (g.lives <= 0) {
    endGame(g, 'caught');
    return;
  }
  // A caught thief is dragged back to the garage door with a short grace
  // period — a fair second chance, not an instant loss.
  g.player.x = ENTRY.x;
  g.player.y = ENTRY.y;
  g.player.clickTarget = null;
  g.respawnGrace = 2.5;
  g.message = 'Caught! Dragged back to the garage — one more chance.';
  g.messageTimer = 3;
  for (const guard of g.guards) {
    guard.state = 'return';
    guard.suspicion = 0;
  }
}

// dt in seconds; keys is the live key Set. Returns a short event string
// for the sound layer ('chase' | 'lock' | 'caught' | null).
export function stepGame(g, dt, keys) {
  if (g.state !== 'playing') return null;
  g.time += dt;
  g.timeLeft = Math.max(0, TIMER_SECONDS - g.time);
  if (g.timeLeft <= 0) {
    endGame(g, 'dawn');
    return null;
  }
  if (g.messageTimer > 0) g.messageTimer -= dt;
  if (g.shake > 0) g.shake -= dt;
  if (g.flash > 0) g.flash -= dt;
  if (g.respawnGrace > 0) g.respawnGrace -= dt;

  const s = solids();
  stepPlayer(g.player, dt, keys, s);
  updateHidden(g.player, g.smokes);
  for (const smoke of g.smokes) smoke.left -= dt;
  g.smokes = g.smokes.filter((x) => x.left > 0);
  for (const pt of g.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.left -= dt;
  }
  g.particles = g.particles.filter((p) => p.left > 0);

  // The vault door opens the moment the thief carries the keycard.
  const vaultDoor = DOORS.find((d) => d.id === 'vault');
  if (g.hasKeycard && vaultDoor.locked) vaultDoor.locked = false;

  // Loot pickup.
  for (const l of LEVEL_LOOT) {
    if (!l.taken && Math.hypot(g.player.x - l.x, g.player.y - l.y) < 30) {
      l.taken = true;
      g.loot += l.value;
      burst(g, l.x, l.y, '#ffd23e');
    }
  }

  // Guards and cameras.
  let anyChase = false;
  let event = null;
  for (const guard of g.guards) {
    const r = stepGuard(guard, dt, g.player, s, () => { event = 'chase'; });
    if (r === 'caught' && g.respawnGrace <= 0) {
      caught(g);
      return 'caught';
    }
    if (r === 'chase') anyChase = true;
  }
  for (const cam of g.cameras) {
    const r = stepCamera(cam, dt, g.player, s, g.time);
    if (r === 'lock') {
      event = 'lock';
      addAlarm(g, ALARM.cameraLockPerSecond);
      // The nearest guard comes to look.
      let best = null;
      let bestD = Infinity;
      for (const guard of g.guards) {
        const d = Math.hypot(guard.x - cam.x, guard.y - cam.y);
        if (d < bestD) { bestD = d; best = guard; }
      }
      if (best && best.state === 'patrol') {
        best.state = 'chase';
        best.unseen = 0;
      }
    }
  }

  // The alarm climbs while a guard hunts and bleeds off while hidden.
  if (anyChase) addAlarm(g, ALARM.guardChasePerSecond * dt);
  else if (!g.player.hidden) g.alarm = Math.max(0, g.alarm - ALARM.decayPerSecond * dt);

  // Escape: jackpot in hand, reach the garage door.
  if (g.jackpot && Math.hypot(g.player.x - ESCAPE.x, g.player.y - ESCAPE.y) < ESCAPE.r) {
    endGame(g, 'win');
  }
  return event;
}

// The vault lock modal: step the flashing, and take a chip press.
export function stepLockModal(g, dt) {
  if (g.state !== 'lock') return null;
  const r = stepLock(g.lock, dt);
  if (g.lock.alarmCost > 0) {
    addAlarm(g, g.lock.alarmCost);
    g.lock.alarmCost = 0;
  }
  if (r === 'done') {
    VAULT.opened = true;
    g.jackpot = true;
    g.loot += LOOT.jackpotValue;
    g.objective = 3;
    g.state = 'playing';
    g.message = 'Jackpot! $1,000 — get to the garage, now.';
    g.messageTimer = 4;
    burst(g, VAULT.x, VAULT.y, '#ffd23e');
  }
  return r;
}

export function pressLockChip(g, index) {
  if (g.state !== 'lock') return null;
  const r = pressChip(g.lock, index);
  if (r === 'done') {
    VAULT.opened = true;
    g.jackpot = true;
    g.loot += LOOT.jackpotValue;
    g.objective = 3;
    g.state = 'playing';
    g.message = 'Jackpot! $1,000 — get to the garage, now.';
    g.messageTimer = 4;
    burst(g, VAULT.x, VAULT.y, '#ffd23e');
  }
  return r;
}

export function trySmoke(g) {
  if (g.state !== 'playing') return false;
  if (useSmoke(g.player, g.smokes)) {
    addAlarm(g, ALARM.toolSmokeCost);
    return true;
  }
  return false;
}

export function tryEmp(g) {
  if (g.state !== 'playing') return false;
  if (useEmp(g.player, g.cameras)) {
    addAlarm(g, ALARM.toolEmpCost);
    return true;
  }
  return false;
}

export function currentPrompt(g) {
  if (g.state !== 'playing') return '';
  const it = nearestInteractable(g);
  return it ? it.label + '  [E]' : '';
}
