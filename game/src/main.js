// main.js — MIDNIGHT VAULT: game loop and state machine.
// Phases: title -> playing -> win | caught | lockdown (paused overlays play).
// The loop owns the alarm meter, loot pickups, the sapphire crack-channel
// and the exit check; guards and cameras own what they see.

import { ALARM, CAMERA, CANVAS, LOOT, SCORE } from './config.js';
import { GUARD_STATE } from './guards.js';
import { Guard } from './guards.js';
import { Camera } from './cameras.js';
import { Player } from './player.js';
import { Sfx } from './audio.js';
import { Input } from './input.js';
import { drawScene } from './render.js';
import { drawEndScreen, drawHud, drawTitleScreen } from './hud.js';
import { applyScene } from './shots.js';
import { EXIT_DOOR, GUARD_ROUTES, CAMERA_MOUNTS, LOOT_SPOTS, SPAWN } from './level.js';
import { distance, pointInRect } from './geometry.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS.width;
canvas.height = CANVAS.height;

const input = new Input(canvas);
const sfx = new Sfx();

const state = {
  phase: 'title', // title | playing | paused | win | caught | lockdown
  time: 0, // wall-clock-ish render time (drives pulses and bobs)
  elapsed: 0, // seconds since the job started
  alarm: 0,
  score: 0,
  loot: {},
  player: new Player(SPAWN.x, SPAWN.y),
  guards: GUARD_ROUTES.map((route) => new Guard(route)),
  cameras: CAMERA_MOUNTS.map((mount) => new Camera(mount)),
  startFlash: true,
  frozenScene: false, // ?scene= renders a fixed frame for screenshots
};

state.player.channelProgress = 0;

function freshLoot() {
  const loot = {};
  for (const spot of LOOT_SPOTS) loot[spot.id] = false;
  return loot;
}

function resetJob() {
  state.phase = 'playing';
  state.elapsed = 0;
  state.alarm = 0;
  state.score = 0;
  state.loot = freshLoot();
  state.player.reset(SPAWN.x, SPAWN.y);
  state.player.channelProgress = 0;
  for (const guard of state.guards) guard.reset();
  for (const camera of state.cameras) camera.reset();
}

function startJob() {
  sfx.unlock();
  resetJob();
}

function endJob(phase) {
  state.phase = phase;
  if (phase === 'win') sfx.win();
  else if (phase === 'caught') sfx.caught();
  else if (phase === 'lockdown') sfx.alarmSting();
}

input.onKey = (code) => {
  sfx.unlock();
  if (code === 'Enter') {
    if (state.phase === 'title' || state.phase === 'win' || state.phase === 'caught' || state.phase === 'lockdown') {
      startJob();
    }
  } else if (code === 'KeyR') {
    if (state.phase !== 'title') startJob();
  } else if (code === 'KeyP') {
    if (state.phase === 'playing') state.phase = 'paused';
    else if (state.phase === 'paused') state.phase = 'playing';
  } else if (code === 'KeyM') {
    sfx.toggleMute();
  }
};

function collectLoot(dt) {
  const player = state.player;
  for (const spot of LOOT_SPOTS) {
    if (state.loot[spot.id]) continue;
    const d = distance(player.x, player.y, spot.x, spot.y);
    if (spot.kind === 'sapphire') {
      // The sapphire needs a crack: stand at the case and hold still.
      if (d < 46 && !player.moving) {
        player.channelProgress += dt / LOOT.sapphire.channelSeconds;
        if (Math.random() < 0.08) sfx.sapphireCrack();
        if (player.channelProgress >= 1) {
          state.loot.sapphire = true;
          state.score += LOOT.sapphire.points;
          player.channelProgress = 0;
          sfx.pickup();
        }
      } else if (d >= 46) {
        player.channelProgress = Math.max(0, player.channelProgress - dt * 0.5);
      }
      continue;
    }
    if (d < 30) {
      state.loot[spot.id] = true;
      state.score += spot.kind === 'goldBar' ? LOOT.goldBar.points : LOOT.intel.points;
      sfx.pickup();
    }
  }
}

function updatePlaying(dt) {
  state.elapsed += dt;
  const player = state.player;

  const click = input.consumeClick();
  if (click) player.clickTarget = { x: click.x, y: click.y };
  player.update(dt, input);
  if (player.stepped) {
    player.stepped = false;
    sfx.footstep(player.sneaking);
  }

  let anyoneSees = false;
  for (const guard of state.guards) {
    const events = guard.update(dt, player);
    if (guard.seesThief) anyoneSees = true;
    if (events.alerted) {
      state.alarm = Math.min(ALARM.max, state.alarm + ALARM.guardAlertJump);
      sfx.alarmSting();
    }
    if (events.caught) {
      endJob('caught');
      return;
    }
    if (guard.state === GUARD_STATE.HUNT) anyoneSees = true;
  }
  for (const camera of state.cameras) {
    camera.update(dt, player);
    if (camera.seesThief) {
      anyoneSees = true;
      state.alarm = Math.min(ALARM.max, state.alarm + CAMERA.alarmPerSecond * dt);
    }
  }

  // Being watched feeds the alarm; hiding lets it bleed off.
  if (anyoneSees) {
    state.alarm = Math.min(ALARM.max, state.alarm + 6 * dt);
  } else {
    state.alarm = Math.max(0, state.alarm - ALARM.decayPerSecond * dt);
  }
  if (state.alarm >= ALARM.max) {
    endJob('lockdown');
    return;
  }

  collectLoot(dt);

  // The exit only counts with the sapphire in hand.
  if (state.loot.sapphire && pointInRect(player.x, player.y, EXIT_DOOR)) {
    const bonus = Math.max(0, Math.round((SCORE.parSeconds - state.elapsed) * SCORE.winBonusPerSecondLeft));
    state.score += Math.min(LOOT.winBonusBase, bonus);
    endJob('win');
  }
}

let lastTimestamp = 0;
function frame(timestamp) {
  const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000 || 0.016);
  lastTimestamp = timestamp;
  state.time += dt;
  state.startFlash = Math.floor(state.time * 2) % 2 === 0;

  if (!state.frozenScene) {
    if (state.phase === 'playing') updatePlaying(dt);
    else if (state.phase === 'title') {
      // Title click starts the job.
      const click = input.consumeClick();
      if (click) startJob();
      // Idle patrol behind the title: guards walk, cameras sweep.
      for (const guard of state.guards) guard.update(dt, { x: -9999, y: -9999, radius: 0, sneaking: false, running: false });
      for (const camera of state.cameras) camera.update(dt, { x: -9999, y: -9999 });
    } else if (state.phase === 'win' || state.phase === 'caught' || state.phase === 'lockdown') {
      input.consumeClick();
    }
  }

  drawScene(ctx, state);
  if (state.phase !== 'title') drawHud(ctx, state);
  if (state.phase === 'title') drawTitleScreen(ctx, state);
  else if (state.phase !== 'playing') drawEndScreen(ctx, state);

  requestAnimationFrame(frame);
}

// Screenshot scenes (?scene=cover&seed=1): a fixed frame, no simulation.
const params = new URLSearchParams(window.location.search);
const scene = params.get('scene');
state.loot = freshLoot();
if (scene) {
  applyScene(state, scene);
  state.frozenScene = true;
  // Guards and cameras keep their preset headings; the scene is the frame.
  // (No update() calls here: they would recompute angles from the clock and
  // wipe the preset poses.)
}

window.__game = { state, version: 'midnight-vault-1.0' };
document.title = 'MIDNIGHT VAULT — ready';
requestAnimationFrame(frame);
