// Sapphire Heist v2 — game loop, input and the phase machine.
// Phases: title -> playing -> paused -> win | caught | lockdown | timeout.
// The loop owns the clock; Game (logic.js) owns the rules; render.js and
// hud.js own the picture. ?scene= presets (scenes.js) stage real game states
// for screenshots, and ?autostart=1 skips the title for play probes.
import { CFG } from './config.js';
import { Game } from './logic.js';
import { Sound } from './audio.js';
import { drawScene } from './render.js';
import { drawEndScreen, drawHud, drawPaused, drawTitle } from './hud.js';
import { applyScene } from './scenes.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CFG.W;
canvas.height = CFG.H;

const sound = new Sound();
const game = new Game(sound);

// Debug handle for play probes and the screenshot driver: live state plus
// a readiness flag the driver waits on before capturing.
window.__game = game;
window.__shotReady = false;

const keys = new Set();
let eQueued = false;

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
};

function readInput() {
  return {
    up: keys.has('up'),
    down: keys.has('down'),
    left: keys.has('left'),
    right: keys.has('right'),
    sneak: keys.has('sneak'),
  };
}

window.addEventListener('keydown', (e) => {
  sound.ensure();
  if (e.code === 'KeyE' || e.code === 'Space') {
    if (!e.repeat) eQueued = true;
    e.preventDefault();
  }
  if (KEYMAP[e.code]) {
    keys.add(KEYMAP[e.code]);
    e.preventDefault();
  }
  if (e.code === 'Enter' && game.phase === 'title') {
    game.phase = 'playing';
  }
  if (e.code === 'KeyP' && (game.phase === 'playing' || game.phase === 'paused')) {
    game.phase = game.phase === 'playing' ? 'paused' : 'playing';
  }
  if (e.code === 'KeyM') {
    sound.muted = !sound.muted;
  }
  if (e.code === 'KeyR' && game.phase !== 'title' && game.phase !== 'playing') {
    restart();
  }
  if (e.code === 'Escape' && game.crack.active) {
    game.crack.active = false;
  }
});

window.addEventListener('keyup', (e) => {
  if (KEYMAP[e.code]) keys.delete(KEYMAP[e.code]);
});

canvas.addEventListener('mousedown', (e) => {
  sound.ensure();
  if (game.phase !== 'playing') return;
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * CFG.W;
  const y = ((e.clientY - rect.top) / rect.height) * CFG.H;
  game.player.clickTarget = { x, y };
});

function restart() {
  const keepSound = game.sound;
  const fresh = new Game(keepSound);
  // Swap the live state in place so window.__game keeps pointing at it.
  for (const k of Object.keys(game)) delete game[k];
  Object.assign(game, fresh);
  game.phase = 'playing';
}

const params = new URLSearchParams(location.search);
if (params.get('autostart') === '1') {
  game.phase = 'playing';
}
const scene = params.get('scene');
if (scene) {
  applyScene(game, scene);
}

let last = performance.now();
let frames = 0;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  frames += 1;

  if (game.phase === 'playing') {
    if (eQueued) {
      game.interact();
      eQueued = false;
    }
    game.update(dt, readInput());
  } else {
    eQueued = false;
    // Title and end screens still animate (pulses, cones idle).
    game.time += dt;
  }

  drawScene(ctx, game);
  if (game.phase === 'title') {
    drawTitle(ctx, game);
  } else if (game.phase === 'paused') {
    drawHud(ctx, game);
    drawPaused(ctx, game);
  } else if (game.phase === 'playing') {
    drawHud(ctx, game);
  } else {
    drawHud(ctx, game);
    drawEndScreen(ctx, game);
  }

  // Screenshots: the scene is staged and a few frames have rendered.
  if (scene && frames > 8) window.__shotReady = true;
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
