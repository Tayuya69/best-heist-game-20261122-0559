// MIDNIGHT EXPRESS — The Gold Train Job.
// A side-view stealth heist aboard a moving luxury train. The thief boards
// the baggage car, slips through the dining car, the sleeper car and the
// vault car, lifts gold bars, dodges patrolling guards and sweeping
// security cameras, and must reach the locomotive door with at least ten
// gold bars before the train arrives. Three lives, one alarm meter, one
// hundred and fifty seconds.
//
// This file is the whole game: state, input, physics, guards, cameras,
// the alarm, the win and lose paths, and all the drawing. It loads the
// train's layout from level.js and nothing else.

import {
  VIEW_W, VIEW_H, FLOOR_Y, WORLD_W, CAR_W, GOLD_NEEDED, TIME_LIMIT,
  START_LIVES, CARS, CRATES, LUGGAGE, GOLD, GUARDS, CAMERAS,
  LOCO_DOOR, CHECKPOINTS,
} from './level.js';

const PW = 26;            // thief width
const PH = 44;            // thief height standing
const PH_CROUCH = 28;     // thief height crouched
const RUN = 250;          // run speed px/s
const SNEAK = 140;        // sneak speed px/s
const CROUCH_SPD = 120;   // crouch speed px/s
const JUMP_V = -520;      // jump velocity
const GRAVITY = 1400;     // gravity px/s^2
const GUARD_RANGE = 200;  // guard vision range
const GUARD_HALF = 0.61;  // guard vision half-angle (radians, ~35 deg)
const CAM_ZONE = 45;      // camera floor-zone half width

// ---------------------------------------------------------------- audio
// Tiny synthesized sound. Everything is guarded: if the browser has no
// audio, every call below is a silent no-op and the game never errors.

function makeAudio() {
  let ctx = null;
  let muted = false;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  } catch (e) { ctx = null; }
  function tone(freq, dur, type, vol, when = 0) {
    if (!ctx || muted) return;
    try {
      const t0 = ctx.currentTime + when;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(vol || 0.08, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    } catch (e) { /* sound is decoration, never fatal */ }
  }
  return {
    get muted() { return muted; },
    set muted(v) { muted = !!v; },
    resume() { if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); },
    coin() { tone(880, 0.09, 'sine', 0.09); tone(1318, 0.12, 'sine', 0.08, 0.07); },
    jump() { tone(300, 0.12, 'square', 0.04); },
    hurt() { tone(160, 0.25, 'sawtooth', 0.1); tone(110, 0.3, 'sawtooth', 0.09, 0.08); },
    alarm() { tone(620, 0.16, 'square', 0.07); tone(460, 0.16, 'square', 0.07, 0.16); },
    chase() { tone(740, 0.1, 'square', 0.06); tone(740, 0.1, 'square', 0.06, 0.12); },
    win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'sine', 0.09, i * 0.11)); },
    click() { tone(520, 0.05, 'sine', 0.05); },
  };
}

// ---------------------------------------------------------------- state

function freshPlayer() {
  return {
    x: 60, y: FLOOR_Y - PH, vx: 0, vy: 0, w: PW, h: PH,
    dir: 1, onGround: true, crouch: false, sneak: false,
    invuln: 0, coyote: 0, jumpBuf: 0,
  };
}

function makeGame() {
  return {
    state: 'title',
    time: 0,
    timeLeft: TIME_LIMIT,
    lives: START_LIVES,
    livesLost: 0,
    score: 0,
    goldCount: 0,
    alarm: 0,
    maxAlarm: 0,
    player: freshPlayer(),
    gold: GOLD.map((g) => ({ x: g.x, y: g.y, taken: false })),
    guards: GUARDS.map((g) => ({
      x: g.x, y: FLOOR_Y - 44, w: 26, h: 44,
      minX: g.minX, maxX: g.maxX, speed: g.speed,
      dir: 1, alert: 0, mode: 'patrol', chaseT: 0, loseT: 0, step: Math.random() * 6,
    })),
    cameras: CAMERAS.map((c) => ({ x: c.x, y: c.y, arc: c.arc, rate: c.rate, phase: Math.random() * 6 })),
    sparks: [],
    camX: 0,
    trackOff: 0,
    checkpoint: 0,
    doorMsgT: 0,
    spotFlash: 0,
    endReason: '',
    endStats: null,
    startedAt: 0,
    frozen: false,
  };
}

function startGame(g) {
  const fresh = makeGame();
  Object.assign(g, fresh);
  g.state = 'playing';
  g.startedAt = g.time;
}

function carIndexAt(x) {
  return Math.max(0, Math.min(CARS.length - 1, Math.floor(x / CAR_W)));
}

// ---------------------------------------------------------------- helpers

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// A crate between the guard's eye and the thief blocks the guard's sight.
// The eye sits near the top of the guard; any crate tall enough to rise
// above it and standing between them hides the thief.
function sightBlocked(gx, gy, px, py) {
  const lo = Math.min(gx, px);
  const hi = Math.max(gx, px);
  for (const c of CRATES) {
    if (c.x + c.w > lo && c.x < hi && c.y < gy + 20 && c.y + c.h > gy) return true;
  }
  return false;
}

function hurtPlayer(g, audio, cause) {
  if (g.player.invuln > 0 || g.state !== 'playing') return;
  g.lives -= 1;
  g.livesLost += 1;
  g.alarm = Math.max(0, g.alarm - 30);
  audio.hurt();
  if (g.lives <= 0) {
    endGame(g, 'lose', cause === 'alarm' ? 'alarm' : 'caught', audio);
    return;
  }
  // Back to the start of this car, briefly untouchable.
  const cp = CHECKPOINTS[g.checkpoint];
  g.player.x = cp;
  g.player.y = FLOOR_Y - PH;
  g.player.vx = 0;
  g.player.vy = 0;
  g.player.invuln = 2;
  for (const gd of g.guards) {
    gd.mode = 'patrol';
    gd.alert = Math.min(gd.alert, 25);
  }
}

function endGame(g, state, reason, audio) {
  g.state = state;
  g.endReason = reason;
  const timeBonus = state === 'win' ? Math.max(0, Math.round(g.timeLeft)) * 10 : 0;
  const ghost = state === 'win' && g.livesLost === 0 ? 500 : 0;
  const goldScore = g.goldCount * 100;
  g.endStats = {
    gold: g.goldCount,
    goldScore,
    timeBonus,
    ghost,
    total: goldScore + timeBonus + ghost,
  };
  g.score = g.endStats.total;
  if (state === 'win') audio.win();
}

// ---------------------------------------------------------------- update

function stepGame(g, dt, keys, audio) {
  g.time += dt;
  g.timeLeft -= dt;
  if (g.timeLeft <= 0) {
    g.timeLeft = 0;
    endGame(g, 'lose', 'time', audio);
    return;
  }
  if (g.doorMsgT > 0) g.doorMsgT -= dt;
  if (g.spotFlash > 0) g.spotFlash -= dt;
  if (g.player.invuln > 0) g.player.invuln -= dt;
  g.trackOff += dt * 320;

  const p = g.player;
  const left = keys.has('arrowleft') || keys.has('a');
  const right = keys.has('arrowright') || keys.has('d');
  p.crouch = keys.has('arrowdown') || keys.has('s');
  p.sneak = keys.has('shift');

  // Horizontal movement.
  let target = 0;
  if (left) target -= 1;
  if (right) target += 1;
  const speed = p.crouch ? CROUCH_SPD : (p.sneak ? SNEAK : RUN);
  p.vx = target * speed;
  if (target !== 0) p.dir = target;
  p.x += p.vx * dt;
  p.x = Math.max(0, Math.min(WORLD_W - p.w, p.x));

  // Stand on crates, bump into their sides. Luggage is low and solid.
  // Only push sideways when the thief is really beside a crate, not when
  // dropping onto its top (the landing step below handles that).
  const solids = CRATES.concat(LUGGAGE);
  for (const s of solids) {
    if (rectsOverlap({ x: p.x, y: p.y, w: p.w, h: p.h }, s) && p.y + p.h - s.y > 12) {
      if (p.vx > 0) p.x = s.x - p.w;
      else if (p.vx < 0) p.x = s.x + s.w;
      else p.x = (p.x + p.w / 2 < s.x + s.w / 2) ? s.x - p.w : s.x + s.w;
    }
  }

  // Jump (with a short coyote window and an input buffer).
  if (p.jumpBuf > 0) p.jumpBuf -= dt;
  if (p.onGround) p.coyote = 0.12;
  else if (p.coyote > 0) p.coyote -= dt;
  if (p.jumpBuf > 0 && p.coyote > 0) {
    p.vy = JUMP_V;
    p.onGround = false;
    p.coyote = 0;
    p.jumpBuf = 0;
    audio.jump();
  }

  // Gravity and vertical landing.
  p.vy += GRAVITY * dt;
  p.y += p.vy * dt;
  p.onGround = false;
  if (p.y + p.h >= FLOOR_Y) {
    p.y = FLOOR_Y - p.h;
    p.vy = 0;
    p.onGround = true;
  }
  for (const s of solids) {
    if (p.vy >= 0 && rectsOverlap({ x: p.x, y: p.y, w: p.w, h: p.h }, s)) {
      if (p.y + p.h - s.y < 18) {
        p.y = s.y - p.h;
        p.vy = 0;
        p.onGround = true;
      }
    }
  }
  // Crouching shortens the thief; keep the feet planted when it changes.
  const feet = p.y + p.h;
  p.h = p.crouch ? PH_CROUCH : PH;
  p.y = feet - p.h;

  // Checkpoint: the start of the car the thief is in.
  g.checkpoint = carIndexAt(p.x + p.w / 2);

  // Gold pickup.
  for (const bar of g.gold) {
    if (bar.taken) continue;
    const r = { x: bar.x - 13, y: bar.y - 7, w: 26, h: 14 };
    if (rectsOverlap({ x: p.x, y: p.y, w: p.w, h: p.h }, r)) {
      bar.taken = true;
      g.goldCount += 1;
      g.score += 100;
      audio.coin();
      g.sparks.push({ x: bar.x, y: bar.y, t: 0 });
    }
  }
  for (const s of g.sparks) s.t += dt;
  g.sparks = g.sparks.filter((s) => s.t < 0.5);

  // Guards: patrol, watch, chase, catch.
  const pCx = p.x + p.w / 2;
  const pCy = p.y + p.h / 2;
  for (const gd of g.guards) {
    gd.step += dt;
    if (gd.mode === 'patrol') {
      gd.x += gd.dir * gd.speed * dt;
      if (gd.x <= gd.minX) { gd.x = gd.minX; gd.dir = 1; }
      if (gd.x >= gd.maxX) { gd.x = gd.maxX; gd.dir = -1; }
    } else {
      gd.x += Math.sign(pCx - gd.x) * 210 * dt;
      gd.x = Math.max(0, Math.min(WORLD_W - gd.w, gd.x));
      gd.dir = pCx >= gd.x ? 1 : -1;
      gd.chaseT -= dt;
      if (gd.chaseT <= 0) { gd.mode = 'patrol'; gd.alert = 20; }
    }
    // Vision: a cone ahead of the guard. The thief is seen when inside
    // the cone's range and angle, on the same level, and not behind a crate.
    const dx = pCx - (gd.x + gd.w / 2);
    const dy = pCy - (gd.y + 22);
    const dist = Math.hypot(dx, dy);
    const inFront = dx * gd.dir > 0;
    const inRange = dist < GUARD_RANGE;
    const inCone = dist > 0 && (dx * gd.dir) / dist > Math.cos(GUARD_HALF);
    const seen = inFront && inRange && inCone &&
      !sightBlocked(gd.x + gd.w / 2, gd.y + 14, pCx, pCy);
    if (seen) {
      const rate = (p.sneak || p.crouch) ? 35 : 70;
      gd.alert = Math.min(100, gd.alert + rate * dt);
      if (gd.alert >= 100 && gd.mode !== 'chase') {
        gd.mode = 'chase';
        gd.chaseT = 4;
        g.spotFlash = 0.6;
        audio.chase();
      }
    } else {
      gd.alert = Math.max(0, gd.alert - 40 * dt);
    }
    // Touching a guard costs a life.
    if (p.invuln <= 0 && rectsOverlap(
      { x: p.x, y: p.y, w: p.w, h: p.h },
      { x: gd.x, y: gd.y, w: gd.w, h: gd.h },
    )) {
      hurtPlayer(g, audio, 'caught');
      if (g.state !== 'playing') return;
    }
  }

  // Cameras: a sweeping beam fills the alarm meter while the thief is in it.
  let inBeam = false;
  for (const cam of g.cameras) {
    const ang = Math.sin(g.time * cam.rate + cam.phase) * cam.arc;
    const floorX = cam.x + (FLOOR_Y - cam.y) * Math.tan(ang);
    if (Math.abs(pCx - floorX) < CAM_ZONE) inBeam = true;
  }
  if (inBeam) {
    const rate = (p.sneak || p.crouch) ? 22 : 45;
    g.alarm = Math.min(100, g.alarm + rate * dt);
    g.maxAlarm = Math.max(g.maxAlarm, g.alarm);
    if (g.alarm >= 100) {
      g.spotFlash = 0.8;
      audio.alarm();
      for (const gd of g.guards) { gd.mode = 'chase'; gd.chaseT = 3; gd.alert = 100; }
      hurtPlayer(g, audio, 'alarm');
      if (g.state !== 'playing') return;
    }
  } else {
    g.alarm = Math.max(0, g.alarm - 25 * dt);
  }

  // The locomotive door: ten gold opens it, fewer just rattles the lock.
  const door = LOCO_DOOR;
  if (rectsOverlap({ x: p.x, y: p.y, w: p.w, h: p.h }, door)) {
    if (g.goldCount >= GOLD_NEEDED) {
      endGame(g, 'win', 'escape', audio);
      return;
    }
    if (g.doorMsgT <= 0) g.doorMsgT = 2;
  }

  // Camera follows the thief, clamped to the train.
  const targetCam = Math.max(0, Math.min(WORLD_W - VIEW_W, pCx - VIEW_W / 2));
  g.camX += (targetCam - g.camX) * Math.min(1, dt * 8);
}

export { makeGame, startGame, stepGame, makeAudio };

// ---------------------------------------------------------------- render

// Stars placed once, deterministically, so every run looks the same.
const STARS = [];
{
  let s = 1234567;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  for (let i = 0; i < 90; i++) STARS.push({ x: rnd() * VIEW_W, y: rnd() * 260, r: rnd() * 1.4 + 0.4 });
}

function drawSky(ctx, g) {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, '#0a0f24');
  grad.addColorStop(0.55, '#141b38');
  grad.addColorStop(1, '#0a0a14');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#dfe6ff';
  for (const st of STARS) {
    ctx.globalAlpha = 0.35 + 0.45 * Math.abs(Math.sin(g.time * 0.7 + st.x));
    ctx.fillRect(st.x, st.y, st.r, st.r);
  }
  ctx.globalAlpha = 1;
  // The moon, high over the train.
  ctx.fillStyle = '#f4ecd0';
  ctx.beginPath();
  ctx.arc(830, 52, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9cfa8';
  ctx.beginPath();
  ctx.arc(822, 46, 5, 0, Math.PI * 2);
  ctx.arc(838, 60, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawTrack(ctx, g) {
  // Ballast, rails and the sleepers rushing past under the train.
  ctx.fillStyle = '#17131c';
  ctx.fillRect(0, FLOOR_Y, VIEW_W, VIEW_H - FLOOR_Y);
  ctx.fillStyle = '#241d29';
  ctx.fillRect(0, FLOOR_Y, VIEW_W, 10);
  const off = g.trackOff % 46;
  ctx.fillStyle = '#3a2f33';
  for (let x = -off; x < VIEW_W + 46; x += 46) {
    ctx.fillRect(x, FLOOR_Y + 34, 30, 8);
    ctx.fillRect(x, FLOOR_Y + 74, 30, 8);
  }
  ctx.fillStyle = '#5a5148';
  ctx.fillRect(0, FLOOR_Y + 30, VIEW_W, 4);
  ctx.fillRect(0, FLOOR_Y + 70, VIEW_W, 4);
  // Wheels under each car.
  ctx.fillStyle = '#0d0b10';
  ctx.strokeStyle = '#4a4450';
  ctx.lineWidth = 3;
  for (let c = 0; c < CARS.length; c++) {
    const wx = c * CAR_W + CAR_W / 2 - g.camX;
    if (wx < -80 || wx > VIEW_W + 80) continue;
    for (const dx of [-260, 260]) {
      ctx.beginPath();
      ctx.arc(wx + dx, FLOOR_Y + 14, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}

function drawTrain(ctx, g) {
  const top = 66;
  for (let c = 0; c < CARS.length; c++) {
    const car = CARS[c];
    const x0 = c * CAR_W - g.camX;
    const x1 = x0 + CAR_W;
    if (x1 < -20 || x0 > VIEW_W + 20) continue;
    // Body and roof.
    ctx.fillStyle = car.color;
    ctx.fillRect(x0, top, CAR_W, FLOOR_Y - top);
    ctx.fillStyle = car.trim;
    ctx.fillRect(x0, top, CAR_W, 10);
    ctx.fillRect(x0, FLOOR_Y - 14, CAR_W, 14);
    // Windows with the night landscape rushing past.
    for (let w = 0; w < 3; w++) {
      const wx = x0 + 120 + w * 260;
      const wy = top + 42;
      ctx.fillStyle = '#0d1526';
      ctx.fillRect(wx, wy, 150, 92);
      ctx.fillStyle = '#1c2c4a';
      ctx.fillRect(wx + 4, wy + 4, 142, 84);
      // Hills sliding by, slower than the track.
      const hillOff = (g.trackOff * 0.35 + w * 90) % 300;
      ctx.fillStyle = '#0a1220';
      ctx.beginPath();
      ctx.moveTo(wx + 4, wy + 88);
      ctx.quadraticCurveTo(wx + 40 - hillOff * 0.2, wy + 30, wx + 90, wy + 88);
      ctx.quadraticCurveTo(wx + 130, wy + 44, wx + 146, wy + 88);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e8e2c8';
      ctx.fillRect(wx + 108, wy + 10, 3, 3);
      ctx.fillRect(wx + 24, wy + 22, 2, 2);
      ctx.strokeStyle = car.trim;
      ctx.lineWidth = 4;
      ctx.strokeRect(wx, wy, 150, 92);
    }
    // Car name.
    ctx.fillStyle = 'rgba(240,230,200,0.55)';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(car.name, x0 + CAR_W / 2, top + 26);
    // Door frame where this car meets the next.
    if (c < CARS.length - 1) {
      ctx.fillStyle = '#0a0810';
      ctx.fillRect(x1 - 8, top + 10, 16, FLOOR_Y - top - 24);
      ctx.fillStyle = car.trim;
      ctx.fillRect(x1 - 10, top + 10, 3, FLOOR_Y - top - 24);
      ctx.fillRect(x1 + 7, top + 10, 3, FLOOR_Y - top - 24);
    }
    // Floor strip.
    ctx.fillStyle = car.floor;
    ctx.fillRect(x0, FLOOR_Y - 14, CAR_W, 14);
  }
}

function drawVault(ctx, g) {
  // The big wall safe in the vault car, the job's prize on the wall.
  const x = 3150 - g.camX;
  if (x < -160 || x > VIEW_W + 40) return;
  ctx.fillStyle = '#4a3f1c';
  ctx.fillRect(x, 190, 130, 150);
  ctx.fillStyle = '#6b5f33';
  ctx.fillRect(x + 8, 198, 114, 134);
  ctx.fillStyle = '#2c2610';
  ctx.beginPath();
  ctx.arc(x + 65, 265, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d8b93a';
  ctx.beginPath();
  ctx.arc(x + 65, 265, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2c2610';
  ctx.beginPath();
  ctx.arc(x + 65, 265, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f0e2a0';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VAULT', x + 65, 360);
}

function drawDoor(ctx, g) {
  const d = LOCO_DOOR;
  const x = d.x - g.camX;
  if (x < -120 || x > VIEW_W + 40) return;
  const open = g.goldCount >= GOLD_NEEDED;
  ctx.fillStyle = open ? '#1f4d2a' : '#4d1f1f';
  ctx.fillRect(x, d.y, d.w, d.h);
  ctx.fillStyle = '#d8b93a';
  ctx.fillRect(x + 6, d.y + 6, d.w - 12, d.h - 12);
  ctx.fillStyle = '#241d10';
  ctx.fillRect(x + 12, d.y + 12, d.w - 24, d.h - 24);
  ctx.fillStyle = open ? '#7ee787' : '#ff7b72';
  ctx.beginPath();
  ctx.arc(x + d.w / 2, d.y + d.h / 2 - 8, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f0e2a0';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ENGINE', x + d.w / 2, d.y + d.h / 2 + 30);
  ctx.fillText(open ? 'OPEN' : `${g.goldCount}/${GOLD_NEEDED} GOLD`, x + d.w / 2, d.y + d.h / 2 + 48);
}

function drawCrates(ctx, g) {
  for (const c of CRATES) {
    const x = c.x - g.camX;
    if (x + c.w < -10 || x > VIEW_W + 10) continue;
    ctx.fillStyle = '#6b4f2a';
    ctx.fillRect(x, c.y, c.w, c.h);
    ctx.fillStyle = '#8a6a38';
    ctx.fillRect(x + 3, c.y + 3, c.w - 6, c.h - 6);
    ctx.strokeStyle = '#4a3517';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, c.y + 3, c.w - 6, c.h - 6);
    ctx.beginPath();
    ctx.moveTo(x + 3, c.y + 3);
    ctx.lineTo(x + c.w - 3, c.y + c.h - 3);
    ctx.moveTo(x + c.w - 3, c.y + 3);
    ctx.lineTo(x + 3, c.y + c.h - 3);
    ctx.stroke();
  }
  for (const l of LUGGAGE) {
    const x = l.x - g.camX;
    if (x + l.w < -10 || x > VIEW_W + 10) continue;
    ctx.fillStyle = '#5a2e2e';
    ctx.beginPath();
    ctx.roundRect(x, l.y, l.w, l.h, 6);
    ctx.fill();
    ctx.fillStyle = '#7a4040';
    ctx.beginPath();
    ctx.roundRect(x + 4, l.y + 4, l.w - 8, l.h - 8, 4);
    ctx.fill();
    ctx.strokeStyle = '#d8b93a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + l.w / 2, l.y);
    ctx.lineTo(x + l.w / 2, l.y + l.h);
    ctx.stroke();
  }
}

function drawGold(ctx, g) {
  for (const bar of g.gold) {
    if (bar.taken) continue;
    const x = bar.x - g.camX;
    if (x < -30 || x > VIEW_W + 30) continue;
    const bob = Math.sin(g.time * 3 + bar.x) * 2;
    ctx.fillStyle = '#8a6d1c';
    ctx.beginPath();
    ctx.moveTo(x - 13, bar.y + 7 + bob);
    ctx.lineTo(x - 9, bar.y - 7 + bob);
    ctx.lineTo(x + 9, bar.y - 7 + bob);
    ctx.lineTo(x + 13, bar.y + 7 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath();
    ctx.moveTo(x - 10, bar.y + 5 + bob);
    ctx.lineTo(x - 7, bar.y - 5 + bob);
    ctx.lineTo(x + 7, bar.y - 5 + bob);
    ctx.lineTo(x + 10, bar.y + 5 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.fillRect(x - 5, bar.y - 4 + bob, 4, 3);
  }
  for (const s of g.sparks) {
    const a = 1 - s.t / 0.5;
    ctx.globalAlpha = a;
    ctx.strokeStyle = '#ffd94a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x - g.camX, s.y - s.t * 40, 6 + s.t * 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawGuards(ctx, g) {
  for (const gd of g.guards) {
    const x = gd.x - g.camX;
    if (x < -260 || x > VIEW_W + 260) continue;
    const eyeX = x + gd.w / 2;
    const eyeY = gd.y + 14;
    // Vision cone: a translucent wedge ahead of the guard.
    const chasing = gd.mode === 'chase';
    const coneCol = chasing ? 'rgba(255,60,60,0.28)' : 'rgba(255,214,80,0.20)';
    ctx.fillStyle = coneCol;
    ctx.beginPath();
    ctx.moveTo(eyeX, eyeY);
    const farX = eyeX + gd.dir * GUARD_RANGE;
    const spread = Math.tan(GUARD_HALF) * GUARD_RANGE;
    ctx.lineTo(farX, eyeY - spread);
    ctx.lineTo(farX, eyeY + spread);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = chasing ? 'rgba(255,60,60,0.5)' : 'rgba(255,214,80,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // The guard: dark blue uniform, cap, belt, boots.
    const bob = Math.sin(gd.step * 9) * (gd.mode === 'patrol' ? 1.5 : 3);
    ctx.fillStyle = '#1e2a4a';
    ctx.fillRect(x, gd.y + 14 + bob * 0.2, gd.w, 30);
    ctx.fillStyle = '#2c3d68';
    ctx.fillRect(x, gd.y + 14 + bob * 0.2, gd.w, 12);
    ctx.fillStyle = '#e8c9a0';
    ctx.beginPath();
    ctx.arc(eyeX, gd.y + 8 + bob * 0.2, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#16213a';
    ctx.fillRect(x + (gd.dir > 0 ? 4 : -4), gd.y - 2 + bob * 0.2, 18, 6);
    ctx.fillStyle = '#d8b93a';
    ctx.fillRect(x, gd.y + 30, gd.w, 3);
    ctx.fillStyle = '#0d0b10';
    ctx.fillRect(x + 2, gd.y + 40, 8, 4);
    ctx.fillRect(x + gd.w - 10, gd.y + 40, 8, 4);
    // Alert bar and mark.
    if (gd.alert > 2) {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(x - 4, gd.y - 14, 34, 6);
      ctx.fillStyle = gd.alert > 66 ? '#ff5040' : '#ffcf3f';
      ctx.fillRect(x - 3, gd.y - 13, 32 * (gd.alert / 100), 4);
    }
    if (chasing || gd.alert > 66) {
      ctx.fillStyle = '#ff5040';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', eyeX, gd.y - 20);
    }
  }
}

function drawCameras(ctx, g) {
  for (const cam of g.cameras) {
    const x = cam.x - g.camX;
    if (x < -160 || x > VIEW_W + 160) continue;
    const ang = Math.sin(g.time * cam.rate + cam.phase) * cam.arc;
    const floorX = cam.x + (FLOOR_Y - cam.y) * Math.tan(ang) - g.camX;
    // The beam, redder as the alarm climbs.
    const heat = g.alarm / 100;
    ctx.fillStyle = `rgba(${Math.round(255 * (0.4 + heat * 0.6))},${Math.round(200 - heat * 140)},60,${0.16 + heat * 0.14})`;
    ctx.beginPath();
    ctx.moveTo(x, cam.y + 8);
    ctx.lineTo(floorX - CAM_ZONE, FLOOR_Y);
    ctx.lineTo(floorX + CAM_ZONE, FLOOR_Y);
    ctx.closePath();
    ctx.fill();
    // The lit floor zone.
    ctx.fillStyle = `rgba(255,214,80,${0.10 + heat * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(floorX, FLOOR_Y - 2, CAM_ZONE + 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // The camera body on the ceiling.
    ctx.fillStyle = '#0d0b10';
    ctx.fillRect(x - 14, cam.y - 8, 28, 14);
    ctx.fillStyle = '#3a3f4a';
    ctx.fillRect(x - 14, cam.y - 8, 28, 5);
    ctx.fillStyle = heat > 0.5 ? '#ff5040' : '#ffcf3f';
    ctx.beginPath();
    ctx.arc(x + Math.sin(ang) * 8, cam.y + 6, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(ctx, g) {
  const p = g.player;
  if (p.invuln > 0 && Math.floor(g.time * 12) % 2 === 0) return; // blink
  const x = p.x - g.camX;
  const y = p.y;
  const h = p.h;
  // The thief: long dark coat, wide-brim hat, mask, gold sack.
  ctx.fillStyle = '#101018';
  ctx.beginPath();
  ctx.roundRect(x, y + 10, p.w, h - 10, 5);
  ctx.fill();
  ctx.fillStyle = '#1d1d2c';
  ctx.beginPath();
  ctx.roundRect(x + 2, y + 12, p.w - 4, h - 14, 4);
  ctx.fill();
  // Head and hat.
  ctx.fillStyle = '#e8c9a0';
  ctx.beginPath();
  ctx.arc(x + p.w / 2, y + 8, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#101018';
  ctx.beginPath();
  ctx.ellipse(x + p.w / 2, y + 2, 13, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + p.w / 2 - 6, y - 8, 12, 10);
  // Mask across the eyes.
  ctx.fillStyle = '#101018';
  ctx.fillRect(x + p.w / 2 - 8, y + 5, 16, 4);
  // Gold sack on the back.
  if (g.goldCount > 0) {
    ctx.fillStyle = '#8a6d1c';
    ctx.beginPath();
    ctx.arc(x + (p.dir > 0 ? 2 : p.w - 2), y + 22, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath();
    ctx.arc(x + (p.dir > 0 ? 2 : p.w - 2), y + 22, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Legs.
  ctx.fillStyle = '#0a0a12';
  const stride = p.vx !== 0 ? Math.sin(g.time * 14) * 4 : 0;
  ctx.fillRect(x + 4 + stride, y + h - 8, 6, 8);
  ctx.fillRect(x + p.w - 10 - stride, y + h - 8, 6, 8);
}

function drawHud(ctx, g) {
  ctx.fillStyle = 'rgba(8,8,16,0.82)';
  ctx.fillRect(0, 0, VIEW_W, 46);
  ctx.fillStyle = '#f0e2a0';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  // Gold and score.
  ctx.fillStyle = '#ffd94a';
  ctx.beginPath();
  ctx.moveTo(16, 30);
  ctx.lineTo(20, 20);
  ctx.lineTo(30, 20);
  ctx.lineTo(34, 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f0e2a0';
  ctx.fillText(`GOLD ${g.goldCount}/${GOLD.length}`, 42, 31);
  ctx.fillStyle = '#b9a8cc';
  ctx.fillText(`SCORE ${g.score}`, 170, 31);
  // Lives as hats.
  for (let i = 0; i < START_LIVES; i++) {
    const lx = 300 + i * 26;
    ctx.fillStyle = i < g.lives ? '#ff5a6e' : '#3a2a33';
    ctx.beginPath();
    ctx.ellipse(lx + 8, 26, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(lx + 3, 16, 10, 9);
  }
  // Timer.
  const t = Math.max(0, Math.ceil(g.timeLeft));
  const mm = Math.floor(t / 60);
  const ss = String(t % 60).padStart(2, '0');
  ctx.fillStyle = t < 30 ? '#ff5040' : '#f0e2a0';
  ctx.fillText(`${mm}:${ss}`, 396, 31);
  // Alarm meter.
  ctx.fillStyle = '#b9a8cc';
  ctx.fillText('ALARM', 470, 31);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(530, 18, 130, 14);
  ctx.fillStyle = g.alarm > 66 ? '#ff5040' : (g.alarm > 33 ? '#ffcf3f' : '#7ee787');
  ctx.fillRect(531, 19, 128 * (g.alarm / 100), 12);
  ctx.strokeStyle = '#4a4450';
  ctx.lineWidth = 1;
  ctx.strokeRect(530, 18, 130, 14);
  // Progress along the train.
  ctx.fillStyle = '#b9a8cc';
  ctx.fillText('TRAIN', 680, 31);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(736, 22, 170, 8);
  for (let c = 0; c < CARS.length; c++) {
    ctx.fillStyle = c === 4 ? '#d8b93a' : '#4a4450';
    ctx.fillRect(736 + c * 34, 20, 30, 12);
  }
  const prog = (g.player.x + g.player.w / 2) / WORLD_W;
  ctx.fillStyle = '#ff5a6e';
  ctx.beginPath();
  ctx.arc(736 + prog * 170, 26, 6, 0, Math.PI * 2);
  ctx.fill();
  // Objective line, on its own row below the meter bar so it never
  // collides with the TRAIN progress track.
  ctx.fillStyle = g.goldCount >= GOLD_NEEDED ? '#7ee787' : '#f0e2a0';
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(
    g.goldCount >= GOLD_NEEDED ? 'ENGINE UNLOCKED — REACH THE LOCOMOTIVE!' : `REACH THE LOCOMOTIVE — ${GOLD_NEEDED} GOLD TO OPEN IT`,
    VIEW_W - 12, 52,
  );
  // The locked-door message.
  if (g.doorMsgT > 0) {
    ctx.fillStyle = 'rgba(255,80,64,0.92)';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`THE ENGINE DOOR NEEDS ${GOLD_NEEDED} GOLD — YOU HAVE ${g.goldCount}`, VIEW_W / 2, 78);
  }
  // Spotted flash.
  if (g.spotFlash > 0) {
    ctx.fillStyle = `rgba(255,40,40,${Math.min(0.25, g.spotFlash * 0.3)})`;
    ctx.fillRect(0, 46, VIEW_W, VIEW_H - 46);
    ctx.fillStyle = '#ff5040';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPOTTED!', VIEW_W / 2, 110);
  }
}

function drawTitle(ctx, g) {
  ctx.fillStyle = 'rgba(6,6,14,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.fillText('MIDNIGHT EXPRESS', VIEW_W / 2, 150);
  ctx.fillStyle = '#ff5a6e';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText('— The Gold Train Job —', VIEW_W / 2, 190);
  ctx.fillStyle = '#e8e2d0';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('A luxury train is carrying gold bullion to the city. You boarded', VIEW_W / 2, 240);
  ctx.fillText('in the baggage car. Slip past the guards, duck the cameras,', VIEW_W / 2, 264);
  ctx.fillText('lift 10 gold bars and reach the locomotive before it arrives.', VIEW_W / 2, 288);
  ctx.fillStyle = '#b9a8cc';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('← → / A D move      SPACE / W jump      S crouch      SHIFT sneak', VIEW_W / 2, 340);
  ctx.fillText('P pause      M mute      R restart      ENTER board', VIEW_W / 2, 364);
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText(g.time % 1 < 0.6 ? 'PRESS ENTER TO BOARD THE TRAIN' : '', VIEW_W / 2, 420);
  ctx.fillStyle = '#8a7a9e';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Guards watch a cone ahead of them — hide behind crates. Cameras sweep a', VIEW_W / 2, 470);
  ctx.fillText('beam across the floor — crossing it fills the ALARM meter. 3 lives. 150 seconds.', VIEW_W / 2, 490);
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(6,6,14,0.7)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#f0e2a0';
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', VIEW_W / 2, 280);
  ctx.fillStyle = '#b9a8cc';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('P to keep moving      R to start over', VIEW_W / 2, 320);
}

function drawEnd(ctx, g) {
  ctx.fillStyle = 'rgba(6,6,14,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  const win = g.state === 'win';
  ctx.fillStyle = win ? '#7ee787' : '#ff5040';
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText(win ? 'CLEAN GETAWAY!' : 'THE JOB FAILED', VIEW_W / 2, 150);
  ctx.fillStyle = '#e8e2d0';
  ctx.font = '17px system-ui, sans-serif';
  if (win) {
    ctx.fillText('You cracked the engine door and rode the gold out of town.', VIEW_W / 2, 190);
  } else if (g.endReason === 'time') {
    ctx.fillText('The train arrived at the terminus. You missed your stop.', VIEW_W / 2, 190);
  } else if (g.endReason === 'alarm') {
    ctx.fillText('The alarm brought every guard in the train down on you.', VIEW_W / 2, 190);
  } else {
    ctx.fillText('The railway police caught you between the cars.', VIEW_W / 2, 190);
  }
  const s = g.endStats || { gold: 0, goldScore: 0, timeBonus: 0, ghost: 0, total: 0 };
  ctx.fillStyle = '#f0e2a0';
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText(`Gold bars: ${s.gold}  × 100  =  ${s.goldScore}`, VIEW_W / 2, 250);
  ctx.fillText(`Time bonus: ${s.timeBonus}`, VIEW_W / 2, 278);
  ctx.fillText(`Ghost bonus (no life lost): ${s.ghost}`, VIEW_W / 2, 306);
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(`TOTAL  ${s.total}`, VIEW_W / 2, 350);
  ctx.fillStyle = '#b9a8cc';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Press R to ride again', VIEW_W / 2, 400);
}

function render(ctx, g) {
  drawSky(ctx, g);
  drawTrain(ctx, g);
  drawTrack(ctx, g);
  drawVault(ctx, g);
  drawDoor(ctx, g);
  drawCrates(ctx, g);
  drawGold(ctx, g);
  drawGuards(ctx, g);
  drawCameras(ctx, g);
  drawPlayer(ctx, g);
}

// ---------------------------------------------------------------- bootstrap

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const game = makeGame();
const audio = makeAudio();
const keys = new Set();
let lastTime = 0;

// The playtest drives the game through this object and never touches the
// DOM. It is not part of the game the player sees.
window.__express = {
  game,
  start: () => { if (game.state === 'title') startGame(game); },
  teleport: (x, y) => {
    game.player.x = x;
    game.player.y = y === undefined ? FLOOR_Y - game.player.h : y;
    game.player.vx = 0;
    game.player.vy = 0;
  },
  setGold: (n) => {
    let taken = 0;
    for (const bar of game.gold) {
      if (taken < n) { bar.taken = true; taken += 1; }
    }
    game.goldCount = taken;
    game.score = taken * 100;
  },
  setAlarm: (v) => { game.alarm = v; game.maxAlarm = Math.max(game.maxAlarm, v); },
  setLives: (n) => { game.lives = n; },
  freeze: (v) => { game.frozen = !!v; },
  win: () => {
    endGame(game, 'win', 'escape', audio);
  },
  lose: (reason) => {
    endGame(game, 'lose', reason || 'caught', audio);
  },
  shot: () => document.body.classList.add('shot'),
  state: () => ({
    state: game.state,
    gold: game.goldCount,
    score: game.score,
    lives: game.lives,
    alarm: Math.round(game.alarm),
    timeLeft: Math.round(game.timeLeft),
    x: Math.round(game.player.x),
  }),
};

// A staged frame for a screenshot: the game is set up and then frozen, so
// the headless capture shows exactly the arranged scene.
function stageShot(kind) {
  document.body.classList.add('shot');
  if (kind === 'title') {
    game.time = 0.2; // the PRESS ENTER line is lit
    return;
  }
  if (kind === 'win') {
    startGame(game);
    game.player.x = 4360;
    game.camX = WORLD_W - VIEW_W;
    game.goldCount = 18;
    game.score = 1800;
    game.timeLeft = 42;
    endGame(game, 'win', 'escape', audio);
    return;
  }
  if (kind === 'spotted') {
    startGame(game);
    game.player.x = 3050;
    game.player.y = FLOOR_Y - game.player.h;
    game.camX = 2570;
    game.alarm = 82;
    game.maxAlarm = 82;
    game.spotFlash = 0.8;
    const gd = game.guards[2];
    gd.mode = 'chase';
    gd.chaseT = 4;
    gd.alert = 100;
    gd.x = 2980;
    gd.dir = 1;
    game.frozen = true;
    return;
  }
  // 'cover': the thief mid-train, a guard watching, a camera sweeping,
  // gold in reach and the alarm meter visibly part-filled.
  if (kind === 'cover') {
    startGame(game);
    game.player.x = 1250;
    game.player.y = FLOOR_Y - game.player.h;
    game.camX = 770;
    game.alarm = 35;
    game.maxAlarm = 35;
    const gd = game.guards[0];
    gd.alert = 55;
    gd.x = 1380;
    gd.dir = -1;
    // Put the dining-car camera's beam over the gold at 1400.
    game.cameras[0].phase = -0.17;
    game.frozen = true;
    return;
  }
  // 'play' (and any other shot): a fresh game from the baggage car.
  startGame(game);
}

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) stageShot(shot);

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  audio.resume();
  if (k === 'enter') {
    if (game.state === 'title') { startGame(game); audio.click(); }
    else if (game.state === 'win' || game.state === 'lose') { startGame(game); audio.click(); }
    return;
  }
  if (k === 'r') {
    if (game.state !== 'title') { startGame(game); audio.click(); }
    return;
  }
  if (k === 'm') { audio.muted = !audio.muted; return; }
  if (k === 'p' && (game.state === 'playing' || game.state === 'paused')) {
    game.state = game.state === 'playing' ? 'paused' : 'playing';
    return;
  }
  if (game.state !== 'playing') return;
  keys.add(k);
  if (k === ' ' || k === 'w' || k === 'arrowup') {
    if (game.player.jumpBuf <= 0) game.player.jumpBuf = 0.12;
  }
});

window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

canvas.addEventListener('click', () => {
  audio.resume();
  if (game.state === 'title') { startGame(game); audio.click(); }
  else if (game.state === 'win' || game.state === 'lose') { startGame(game); audio.click(); }
});

function frame(t) {
  const dt = Math.min(0.05, (t - lastTime) / 1000 || 0.016);
  lastTime = t;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);

  if (game.state === 'title') {
    render(ctx, game);
    drawTitle(ctx, game);
  } else if (game.state === 'paused') {
    render(ctx, game);
    drawHud(ctx, game);
    drawPaused(ctx);
  } else if (game.state === 'playing') {
    if (!game.frozen) stepGame(game, dt, keys, audio);
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
