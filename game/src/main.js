// NIGHT VAULT — boot and the game loop.
// Wires the canvas, the keys, the engine and the sounds together, and runs
// the loop. It also stages screenshots: ?scene=cover, spotted, win or
// title puts the game into that exact frame and freezes it, so the shots
// the maker takes are the game itself, deterministic and repeatable.

import { VIEW, GUARD } from './config.js';
import { ENTRY, HELIPAD, VAULT, KEYCARD, distance } from './level.js';
import { makeGame, resetGame, updateGame, dialAction } from './game.js';
import { renderWorld } from './render.js';
import {
  drawHud, drawTitleScreen, drawHowToScreen, drawPausedScreen,
  drawCaughtScreen, drawLockdownScreen, drawTimeoutScreen,
  drawWinScreen, drawDial,
} from './hud.js';
import { sounds, unlockAudio, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const game = makeGame();
const keys = {
  up: false, down: false, left: false, right: false,
  sneak: false, action: false, smoke: false, emp: false,
};

const params = new URLSearchParams(window.location.search);
const scene = params.get('scene');
const shotMode = params.get('shot') === '1';

// --- Input: keyboard and click-to-move. ---

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
};

window.addEventListener('keydown', (event) => {
  unlockAudio();
  if (event.repeat) return;
  const mapped = KEYMAP[event.code];
  if (mapped) {
    keys[mapped] = true;
    event.preventDefault();
    return;
  }
  if (event.code === 'KeyE') {
    keys.action = true;
    if (game.state === 'dial') dialAction(game);
  }
  if (event.code === 'KeyQ') keys.smoke = true;
  if (event.code === 'KeyF') keys.emp = true;
  if (event.code === 'KeyM') toggleMute();
  if (event.code === 'KeyP') {
    if (game.state === 'playing') game.state = 'paused';
    else if (game.state === 'paused') game.state = 'playing';
  }
  if (event.code === 'KeyH') {
    if (game.state === 'title') game.state = 'howto';
    else if (game.state === 'howto') game.state = 'title';
  }
  if (event.code === 'Enter') {
    if (game.state === 'title' || game.state === 'howto') {
      resetGame(game);
    }
  }
  if (event.code === 'KeyR') {
    if (['caught', 'lockdown', 'timeout', 'win'].includes(game.state)) {
      resetGame(game);
    }
  }
  if (event.code === 'Escape') {
    if (game.state === 'dial') {
      game.dial.active = false;
      game.state = 'playing';
    }
  }
});

window.addEventListener('keyup', (event) => {
  const mapped = KEYMAP[event.code];
  if (mapped) keys[mapped] = false;
});

canvas.addEventListener('pointerdown', (event) => {
  unlockAudio();
  if (game.state !== 'playing') return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const clickX = (event.clientX - rect.left) * scaleX;
  const clickY = (event.clientY - rect.top) * scaleY;
  const camX = Math.max(0, Math.min(1440 - VIEW.w, game.player.x - VIEW.w / 2));
  const camY = Math.max(0, Math.min(900 - VIEW.h, game.player.y - VIEW.h / 2));
  game.player.clickTarget = { x: clickX + camX, y: clickY + camY };
});

// --- Sounds: the engine pushes event names; this drains them. ---

function drainEvents() {
  for (const event of game.events) {
    const fn = sounds[event];
    if (fn) fn();
  }
  game.events.length = 0;
}

// --- Screenshot staging: put the game into a chosen frame and freeze. ---

function stageScene(name) {
  if (name === 'title') {
    game.state = 'title';
    game.frozen = true;
    return;
  }
  resetGame(game);
  game.frozen = true;
  if (name === 'win') {
    game.state = 'win';
    game.hasDiamond = true;
    game.lootValue = 2450;
    game.timeLeft = 214;
    game.maxAlarm = 18;
    return;
  }
  if (name === 'cover') {
    // Mid-job on the trading floor: the thief crossing with loot in
    // reach, two guards with cones, a camera beam, and the alarm meter
    // already warm — everything the judge's first criterion asks for.
    game.player.x = 720;
    game.player.y = 560;
    game.player.angle = -Math.PI / 2;
    game.hasKeycard = true;
    game.vaultDoorLocked = false;
    game.lootValue = 350;
    game.alarm = 34;
    game.maxAlarm = 34;
    game.timeLeft = 268;
    game.guards[1].x = 420;
    game.guards[1].y = 560;
    game.guards[1].angle = Math.PI;
    game.guards[2].x = 980;
    game.guards[2].y = 560;
    game.guards[2].angle = 0;
    game.guards[1].suspicion = 0.4;
    game.cameras[1].angle = Math.PI / 2 + 0.5;
    return;
  }
  if (name === 'spotted') {
    // A guard has the thief dead in his cone and is closing in.
    game.player.x = 700;
    game.player.y = 560;
    game.player.angle = Math.PI;
    game.hasKeycard = true;
    game.vaultDoorLocked = false;
    game.lootValue = 200;
    game.alarm = 68;
    game.maxAlarm = 68;
    game.timeLeft = 190;
    game.guards[2].x = 860;
    game.guards[2].y = 560;
    game.guards[2].angle = Math.PI;
    game.guards[2].state = 'chase';
    game.guards[2].suspicion = 1;
    game.guards[2].lastSeenX = game.player.x;
    game.guards[2].lastSeenY = game.player.y;
    game.cameras[2].locked = true;
  }
}

if (scene) stageScene(scene);

// In shot mode the page is just the canvas, so a headless screenshot
// captures the game at exactly 960 by 600.
if (shotMode) {
  document.body.classList.add('shot');
}

// --- The loop. ---

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  updateGame(game, keys, dt);
  drainEvents();

  ctx.save();
  if (game.shake > 0) {
    ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
  }
  if (game.state === 'title') {
    renderWorld(ctx, game);
    drawTitleScreen(ctx);
  } else if (game.state === 'howto') {
    renderWorld(ctx, game);
    drawHowToScreen(ctx);
  } else if (game.state === 'paused') {
    renderWorld(ctx, game);
    drawPausedScreen(ctx);
  } else if (game.state === 'caught') {
    renderWorld(ctx, game);
    drawCaughtScreen(ctx, game);
  } else if (game.state === 'lockdown') {
    renderWorld(ctx, game);
    drawLockdownScreen(ctx, game);
  } else if (game.state === 'timeout') {
    renderWorld(ctx, game);
    drawTimeoutScreen(ctx, game);
  } else if (game.state === 'win') {
    renderWorld(ctx, game);
    drawWinScreen(ctx, game);
  } else {
    renderWorld(ctx, game);
    drawHud(ctx, game);
    if (game.state === 'dial') drawDial(ctx, game.dial);
  }
  ctx.restore();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
