// NIGHT VAULT — the engine.
// The state machine and the per-frame update. One job: take the current
// state, the held keys and a slice of time, and move the heist forward.
// Sounds are not played here; they are pushed as event names and the boot
// code plays them, so this file has no browser dependency beyond Math.

import {
  ALARM, TIMER_SECONDS, LIVES, LOOT,
} from './config.js';
import {
  VAULT, HELIPAD, ENTRY, KEYCARD, LOOT_SPOTS,
  GUARD_ROUTES, CAMERAS, distance,
} from './level.js';
import { makeGuard, makeCamera, updateGuard, updateCamera } from './guards.js';
import { makePlayer, updatePlayer, useSmoke, useEmp, inSmoke } from './player.js';
import { makeDial, openDial, closeDial, updateDial, lockTumbler } from './vault.js';

export function makeGame() {
  return {
    state: 'title', // title | howto | playing | dial | paused | caught | lockdown | timeout | win
    player: makePlayer(ENTRY.x, ENTRY.y),
    guards: GUARD_ROUTES.map((route, i) => makeGuard(route, i)),
    cameras: CAMERAS.map((mount) => makeCamera(mount)),
    loot: LOOT_SPOTS.map((spot) => ({ ...spot, taken: false })),
    dial: makeDial(),
    vaultDoorLocked: true,
    hasKeycard: false,
    vaultOpen: false,
    hasDiamond: false,
    lootValue: 0,
    alarm: 0,
    maxAlarm: 0,
    timeLeft: TIMER_SECONDS,
    lives: LIVES,
    smoke: null,
    particles: [],
    events: [],
    prompt: null,
    toast: null,
    toastSeconds: 0,
    invulnerableSeconds: 0,
    shake: 0,
    frozen: false, // staged screenshots: render the scene, do not advance it
  };
}

export function resetGame(game) {
  const fresh = makeGame();
  fresh.state = 'playing';
  Object.assign(game, fresh);
}

function spawnParticles(game, x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 70;
    game.particles.push({
      x, y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: 0.5 + Math.random() * 0.4,
      maxLife: 0.9,
      size: 2 + Math.random() * 3,
      color,
    });
  }
}

function updateParticles(game, dt) {
  for (const p of game.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  game.particles = game.particles.filter((p) => p.life > 0);
}

function lootValueFor(kind) {
  if (kind === 'cash') return LOOT.cashValue;
  if (kind === 'gold') return LOOT.goldValue;
  return LOOT.bondValue;
}

// The objective chain, checked every frame while playing:
// keycard -> vault door -> dial -> diamond -> helipad.
function updateObjectives(game, keys) {
  const player = game.player;

  for (const loot of game.loot) {
    if (!loot.taken && distance(player.x, player.y, loot.x, loot.y) < 26) {
      loot.taken = true;
      game.lootValue += lootValueFor(loot.kind);
      spawnParticles(game, loot.x, loot.y, '#f2c14e', 10);
      game.events.push('pickup');
    }
  }

  if (!game.hasKeycard && distance(player.x, player.y, KEYCARD.x, KEYCARD.y) < 30) {
    game.hasKeycard = true;
    game.toast = 'Keycard lifted — the vault floor is yours to open';
    game.toastSeconds = 3;
    spawnParticles(game, KEYCARD.x, KEYCARD.y, '#4fd2ff', 12);
    game.events.push('keycard');
  }

  if (game.vaultDoorLocked && game.hasKeycard) {
    const doorX = 720;
    const doorY = 706;
    if (distance(player.x, player.y, doorX, doorY) < 46) {
      game.vaultDoorLocked = false;
      game.toast = 'Vault floor unlocked';
      game.toastSeconds = 3;
      game.events.push('unlock');
    }
  }

  const vaultDistance = distance(player.x, player.y, VAULT.x, VAULT.y);
  if (!game.vaultOpen) {
    if (vaultDistance < 86) {
      game.prompt = 'E — crack the vault dial';
      if (keys.action) {
        keys.action = false;
        openDial(game.dial);
        game.state = 'dial';
        game.events.push('click');
      }
    } else {
      game.prompt = null;
    }
  } else if (!game.hasDiamond) {
    if (vaultDistance < 66) {
      game.hasDiamond = true;
      game.lootValue += LOOT.diamondValue;
      game.toast = 'The Aurum Diamond is yours — get to the pad';
      game.toastSeconds = 3.5;
      spawnParticles(game, VAULT.x, VAULT.y, '#f2c14e', 24);
      game.events.push('vaultOpen');
    }
  }

  if (game.hasDiamond && distance(player.x, player.y, HELIPAD.x, HELIPAD.y) < HELIPAD.radius) {
    game.state = 'win';
    game.events.push('win');
  }
}

function onCaught(game) {
  game.lives -= 1;
  game.alarm = Math.min(ALARM.max, game.alarm + ALARM.catchPenalty);
  game.shake = 0.5;
  game.events.push('caught');
  if (game.lives <= 0) {
    game.state = 'caught';
    game.events.push('lose');
    return;
  }
  // A caught thief wakes up on the rooftop, with a few seconds of grace.
  game.player.x = ENTRY.x;
  game.player.y = ENTRY.y;
  game.player.clickTarget = null;
  game.invulnerableSeconds = 2.5;
  for (const guard of game.guards) {
    guard.state = 'return';
    guard.suspicion = 0;
    guard.unseenSeconds = 0;
  }
  game.toast = `Caught! Back to the rooftop — ${game.lives} ${game.lives === 1 ? 'heart' : 'hearts'} left`;
  game.toastSeconds = 3;
}

export function updateGame(game, keys, dt) {
  if (game.state === 'dial') {
    updateDial(game.dial, dt);
    return;
  }
  if (game.state !== 'playing' || game.frozen) return;

  game.timeLeft -= dt;
  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    game.state = 'timeout';
    game.events.push('lose');
    return;
  }

  if (game.invulnerableSeconds > 0) game.invulnerableSeconds -= dt;
  if (game.toastSeconds > 0) game.toastSeconds -= dt;
  if (game.shake > 0) game.shake -= dt;

  // Tools: Q for smoke, F for the EMP. Each one costs alarm.
  if (keys.smoke) {
    keys.smoke = false;
    if (useSmoke(game.player, game)) game.events.push('smoke');
  }
  if (keys.emp) {
    keys.emp = false;
    if (useEmp(game.player, game)) game.events.push('emp');
  }

  if (game.smoke) {
    game.smoke.seconds -= dt;
    if (game.smoke.seconds <= 0) game.smoke = null;
  }

  updatePlayer(game.player, keys, dt, game.vaultDoorLocked);
  if (game.player.stepSound <= 0 && game.player.moving) {
    game.player.stepSound = game.player.sneaking ? 0.55 : 0.34;
    game.events.push('step');
  }

  const sneaking = game.player.sneaking;
  const hidden = inSmoke(game.player, game.smoke);
  let anyChase = false;
  let anyCameraLocked = false;
  for (const guard of game.guards) {
    const caught = updateGuard(guard, game.player, sneaking, dt, game.vaultDoorLocked, hidden ? game.smoke : null);
    if (guard.state === 'chase') anyChase = true;
    if (caught && game.invulnerableSeconds <= 0) {
      onCaught(game);
      if (game.state !== 'playing') return;
    }
  }
  for (const camera of game.cameras) {
    updateCamera(camera, game.player, game.guards, dt, game.vaultDoorLocked, hidden ? game.smoke : null);
    if (camera.locked) anyCameraLocked = true;
  }

  // The alarm: it climbs while anyone is on to you, and bleeds off while
  // you are hidden. A fresh lock or a fresh chase stings once.
  const wasAlarming = game.alarm >= 60;
  if (anyChase) game.alarm += ALARM.guardChasePerSecond * dt;
  if (anyCameraLocked) game.alarm += ALARM.cameraLockPerSecond * dt;
  if (!anyChase && !anyCameraLocked) {
    game.alarm = Math.max(0, game.alarm - ALARM.decayPerSecond * dt);
  }
  game.alarm = Math.min(ALARM.max, game.alarm);
  game.maxAlarm = Math.max(game.maxAlarm, game.alarm);
  if (game.alarm >= 60 && !wasAlarming) game.events.push('alarm');
  if (game.alarm >= ALARM.max) {
    game.state = 'lockdown';
    game.events.push('lose');
    return;
  }

  updateObjectives(game, keys);
  updateParticles(game, dt);
}

// The dial's action key: lock a tumbler. Returns what happened.
export function dialAction(game) {
  const result = lockTumbler(game.dial, game);
  if (result === 'lock') game.events.push('dialLock');
  if (result === 'miss') {
    game.events.push('dialMiss');
    game.shake = 0.3;
  }
  if (result === 'open') {
    game.vaultOpen = true;
    game.state = 'playing';
    game.events.push('vaultOpen');
  }
  return result;
}

export function finalScore(game) {
  const timeBonus = Math.round(game.timeLeft) * LOOT.timeBonusPerSecond;
  const ghostBonus = game.maxAlarm <= ALARM.ghostCeiling ? LOOT.ghostBonus : 0;
  return game.lootValue + timeBonus + ghostBonus;
}
