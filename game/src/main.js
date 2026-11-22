// NEON VAULT — The Golden Chip Job: bootstrap and input.
// Wires the canvas, the keys, the mouse and the animation loop together
// and routes each frame to the right screen: title, playing, the vault
// lock, pause, or an end screen. The game object is exposed on
// window.__neon so a playtest can drive it and take screenshots.

import { VIEW } from './config.js';
import { makeGame, startGame, stepGame, stepLockModal, pressLockChip, interact, trySmoke, tryEmp, currentPrompt } from './game.js';
import { render, cameraFor } from './render.js';
import { drawHud, drawTitle, drawPaused, drawLock, drawEnd } from './hud.js';
import { makeAudio, sfx } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const game = makeGame();
const audio = makeAudio();
const keys = new Set();
let lastTime = 0;

// Screenshot hook: the playtest drives the game through this object and
// never touches the DOM. It is not part of the game the player sees.
window.__neon = {
  game,
  start: () => { if (game.state === 'title') startGame(game); },
  teleport: (x, y) => { game.player.x = x; game.player.y = y; },
  setAlarm: (v) => { game.alarm = v; game.maxAlarm = Math.max(game.maxAlarm, v); },
  openLock: () => { game.state = 'lock'; },
  win: () => { game.state = 'win'; game.endStats = { loot: 1250, timeBonus: 420, ghost: 500, total: 2170 }; },
  shot: () => document.body.classList.add('shot'),
};

function screenPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
}

canvas.addEventListener('click', (e) => {
  if (game.state === 'lock') {
    // Click a chip in the lock modal.
    const size = 84;
    const gap = 26;
    const total = 4 * size + 3 * gap;
    const x0 = (VIEW.w - total) / 2;
    const y0 = 210;
    const p = screenPos(e);
    for (let i = 0; i < 4; i++) {
      const cx = x0 + i * (size + gap) + size / 2;
      const cy = y0 + size / 2;
      if (Math.hypot(p.x - cx, p.y - cy) < size / 2) {
        const r = pressLockChip(game, i);
        if (r) sfx.chip(audio, i);
        return;
      }
    }
    return;
  }
  if (game.state !== 'playing') return;
  // Click to walk: convert the screen point into world coordinates.
  const p = screenPos(e);
  const cam = cameraFor(game.player);
  game.player.clickTarget = { x: p.x + cam.x, y: p.y + cam.y };
  sfx.click(audio);
});

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (k === 'enter' && game.state === 'title') { startGame(game); return; }
  if (k === 'r') { startGame(game); return; }
  if (k === 'm') { audio.muted = !audio.muted; return; }
  if (k === 'p' && (game.state === 'playing' || game.state === 'paused')) {
    game.state = game.state === 'playing' ? 'paused' : 'playing';
    return;
  }
  if (game.state === 'lock') {
    if (k === 'escape') { game.state = 'playing'; return; }
    const idx = ['1', '2', '3', '4'].indexOf(k);
    if (idx >= 0) {
      const r = pressLockChip(game, idx);
      if (r) sfx.chip(audio, idx);
    }
    return;
  }
  if (game.state !== 'playing') return;
  keys.add(k);
  if (k === 'e') interact(game);
  if (k === 'q') { if (trySmoke(game)) sfx.click(audio); }
  if (k === 'f') { if (tryEmp(game)) sfx.click(audio); }
});

window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

function frame(t) {
  const dt = Math.min(0.05, (t - lastTime) / 1000 || 0.016);
  lastTime = t;
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);

  if (game.state === 'title') {
    render(ctx, game);
    drawTitle(ctx, game);
  } else if (game.state === 'paused') {
    render(ctx, game);
    drawHud(ctx, game);
    drawPaused(ctx);
  } else if (game.state === 'lock') {
    render(ctx, game);
    drawHud(ctx, game);
    stepLockModal(game, dt);
    drawLock(ctx, game);
  } else if (game.state === 'playing') {
    game.prompt = currentPrompt(game);
    const event = stepGame(game, dt, keys);
    if (event === 'chase') sfx.chase(audio);
    else if (event === 'lock') sfx.alarm(audio);
    else if (event === 'caught') sfx.caught(audio);
    render(ctx, game);
    drawHud(ctx, game);
  } else {
    render(ctx, game);
    drawHud(ctx, game);
    drawEnd(ctx, game);
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
