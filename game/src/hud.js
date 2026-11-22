// NIGHT VAULT — the HUD and the screens.
// The HUD is screen space: the objective, the loot, the alarm meter, the
// clock, the hearts and the tool counts, all in one bar, plus an arrow
// that points at the current objective when it is off screen. The screens
// are the title, the how-to, pause, caught, lockdown, dawn and the win.

import { VIEW, ALARM, LOOT, TOOLS } from './config.js';
import { distance, KEYCARD } from './level.js';

function objectiveFor(game) {
  if (!game.hasKeycard) return { text: 'Lift the keycard from the manager’s office', x: KEYCARD.x, y: KEYCARD.y };
  if (game.vaultDoorLocked) return { text: 'Unlock the vault-floor door with the keycard', x: 720, y: 706 };
  if (!game.vaultOpen) return { text: 'Crack the vault dial (E at the vault)', x: 720, y: 828 };
  if (!game.hasDiamond) return { text: 'Take the Aurum Diamond', x: 720, y: 828 };
  return { text: 'Escape — reach the helicopter pad', x: 120, y: 90 };
}

function formatClock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function alarmColor(alarm) {
  if (alarm < 40) return '#7fd08a';
  if (alarm < 70) return '#f2c14e';
  return '#e03e34';
}

export function drawHud(ctx, game) {
  const objective = objectiveFor(game);
  // Top bar.
  ctx.fillStyle = 'rgba(8, 10, 16, 0.85)';
  ctx.fillRect(0, 0, VIEW.w, 44);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(objective.text, 12, 18);
  ctx.fillStyle = '#9aa1b0';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`Loot $${game.lootValue}`, 12, 36);

  // Alarm meter, centre.
  const meterX = 380;
  const meterW = 200;
  ctx.fillStyle = '#20242e';
  ctx.fillRect(meterX, 10, meterW, 14);
  ctx.fillStyle = alarmColor(game.alarm);
  ctx.fillRect(meterX, 10, (meterW * game.alarm) / ALARM.max, 14);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(meterX + 0.5, 10.5, meterW - 1, 13);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`ALARM ${Math.round(game.alarm)}%`, meterX + meterW / 2, 36);

  // Clock, hearts and tools, right.
  ctx.textAlign = 'right';
  ctx.fillStyle = game.timeLeft < 60 ? '#ff5a4e' : '#e8e4d8';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(formatClock(game.timeLeft), VIEW.w - 12, 18);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = '13px system-ui, sans-serif';
  let hearts = '';
  for (let i = 0; i < game.lives; i++) hearts += '♥ ';
  ctx.fillText(hearts, VIEW.w - 12, 36);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#9aa1b0';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(`Q smoke ×${game.player.smokeCharges}   F EMP ×${game.player.empCharges}`, 600, 36);

  // Objective arrow: when the current objective is off screen, point at
  // it from the edge so the thief always knows where the job leads.
  const camX = Math.max(0, Math.min(1440 - VIEW.w, game.player.x - VIEW.w / 2));
  const camY = Math.max(0, Math.min(900 - VIEW.h, game.player.y - VIEW.h / 2));
  const sx = objective.x - camX;
  const sy = objective.y - camY;
  if (sx < 0 || sx > VIEW.w || sy < 44 || sy > VIEW.h) {
    const cx = VIEW.w / 2;
    const cy = VIEW.h / 2;
    const angle = Math.atan2(sy - cy, sx - cx);
    const ax = cx + Math.cos(angle) * 200;
    const ay = cy + Math.sin(angle) * 160;
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-8, -8);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Context prompt under the player: what E does here, right now.
  if (game.prompt) {
    ctx.fillStyle = 'rgba(8, 10, 16, 0.8)';
    const w = ctx.measureText(game.prompt).width + 24;
    ctx.fillRect(VIEW.w / 2 - w / 2, VIEW.h - 52, w, 26);
    ctx.fillStyle = '#f2c14e';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.prompt, VIEW.w / 2, VIEW.h - 34);
  }

  // A toast line for the big moments: keycard lifted, door unlocked.
  if (game.toast && game.toastSeconds > 0) {
    ctx.fillStyle = 'rgba(8, 10, 16, 0.8)';
    const w = ctx.measureText(game.toast).width + 28;
    ctx.fillRect(VIEW.w / 2 - w / 2, 56, w, 26);
    ctx.fillStyle = '#7fd08a';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.toast, VIEW.w / 2, 74);
  }
}

function dimScreen(ctx, alpha) {
  ctx.fillStyle = `rgba(5, 7, 12, ${alpha})`;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
}

function centreTitle(ctx, title, titleColor) {
  ctx.fillStyle = titleColor;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW.w / 2, 170);
}

function centreLines(ctx, lines, startY, color, font) {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  let y = startY;
  for (const line of lines) {
    ctx.fillText(line, VIEW.w / 2, y);
    y += 26;
  }
}

export function drawTitleScreen(ctx) {
  dimScreen(ctx, 0.72);
  centreTitle(ctx, 'NIGHT VAULT', '#f2c14e');
  centreLines(ctx, ['The Aurum Bank Job'], 205, '#4fd2ff', 'bold 20px system-ui, sans-serif');
  centreLines(ctx, [
    'One thief. One tower. One Aurum Diamond.',
    'Drop in on the rooftop, lift the keycard from the manager’s office,',
    'crack the vault dial, and be on the helicopter pad before dawn.',
  ], 250, '#e8e4d8', '15px system-ui, sans-serif');
  centreLines(ctx, [
    'WASD / arrows — move      Shift — sneak      E — interact / crack',
    'Q — smoke bomb (×2)      F — EMP, kills cameras (×1)      Click — walk there',
    'P — pause      M — mute      R — retry',
  ], 350, '#9aa1b0', '14px system-ui, sans-serif');
  centreLines(ctx, ['Press ENTER to start the job'], 450, '#f2c14e', 'bold 18px system-ui, sans-serif');
  centreLines(ctx, ['H — how to play'], 485, '#9aa1b0', '13px system-ui, sans-serif');
}

export function drawHowToScreen(ctx) {
  dimScreen(ctx, 0.78);
  centreTitle(ctx, 'HOW TO PLAY', '#f2c14e');
  centreLines(ctx, [
    'Guards patrol with vision cones. A cone filling with amber means',
    'you are being seen; a full cone means the guard is coming for you.',
    'Cameras sweep red beams. A beam that locks on calls the nearest guard.',
    'Cover blocks sight — walls, desks, terminals and planters all hide you.',
    'Smoke (Q) blinds the room for 5 seconds but trips a sensor (+5 alarm).',
    'EMP (F) kills every camera for 20 seconds but trips a tamper alarm (+8).',
    'The alarm bleeds off while you hide. At 100% the tower locks down.',
    'Three hearts. A catch costs one heart, +25 alarm, and a trip back',
    'to the rooftop. Dawn is 6:00 — be on the pad with the diamond by then.',
  ], 220, '#e8e4d8', '14px system-ui, sans-serif');
  centreLines(ctx, ['Press H or ENTER to go back'], 520, '#f2c14e', 'bold 16px system-ui, sans-serif');
}

export function drawPausedScreen(ctx) {
  dimScreen(ctx, 0.6);
  centreTitle(ctx, 'PAUSED', '#e8e4d8');
  centreLines(ctx, ['Press P to keep the job going'], 230, '#9aa1b0', '15px system-ui, sans-serif');
}

function drawEndScreen(ctx, title, titleColor, lines, scoreLines) {
  dimScreen(ctx, 0.72);
  centreTitle(ctx, title, titleColor);
  centreLines(ctx, lines, 220, '#e8e4d8', '15px system-ui, sans-serif');
  if (scoreLines.length > 0) {
    centreLines(ctx, scoreLines, 330, '#f2c14e', 'bold 15px system-ui, sans-serif');
  }
  centreLines(ctx, ['Press R to run it back'], 470, '#9aa1b0', '15px system-ui, sans-serif');
}

export function drawCaughtScreen(ctx, game) {
  drawEndScreen(ctx, 'CAUGHT', '#e03e34', [
    'A guard got his hands on you, and the tower woke up.',
    `You lifted $${game.lootValue} of loot before the run ended.`,
  ], []);
}

export function drawLockdownScreen(ctx, game) {
  drawEndScreen(ctx, 'LOCKDOWN', '#e03e34', [
    'The alarm hit 100%. Steel shutters, every door, every stairwell.',
    `You lifted $${game.lootValue} of loot before the tower sealed.`,
  ], []);
}

export function drawTimeoutScreen(ctx, game) {
  drawEndScreen(ctx, 'DAWN BREAKS', '#e03e34', [
    'Six o’clock. The city wakes, the vault stays shut, the pad is empty.',
    `You lifted $${game.lootValue} of loot before the sun came up.`,
  ], []);
}

export function drawWinScreen(ctx, game) {
  const timeBonus = Math.round(game.timeLeft) * LOOT.timeBonusPerSecond;
  const ghostBonus = game.maxAlarm <= ALARM.ghostCeiling ? LOOT.ghostBonus : 0;
  const total = game.lootValue + timeBonus + ghostBonus;
  drawEndScreen(ctx, 'CLEAN GETAWAY', '#7fd08a', [
    'The Aurum Diamond is in the bag and the helicopter is already',
    'lifting off the rooftop. The tower never knew you were there.',
  ], [
    `Loot $${game.lootValue}   +   time $${timeBonus}   +   ghost $${ghostBonus}`,
    `FINAL SCORE  ${total}`,
  ]);
}

// The vault dial, drawn as a modal over the paused world.
export function drawDial(ctx, dial) {
  dimScreen(ctx, 0.6);
  const cx = VIEW.w / 2;
  const cy = VIEW.h / 2 - 10;
  const r = 130;
  ctx.fillStyle = '#14161c';
  ctx.beginPath();
  ctx.arc(cx, cy, r + 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 26, 0, Math.PI * 2);
  ctx.stroke();
  // The target arc for the current tumbler, in green.
  const target = dial.targets[dial.tumbler];
  ctx.fillStyle = 'rgba(127, 208, 138, 0.55)';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, target - 0.45, target + 0.45);
  ctx.closePath();
  ctx.fill();
  // Tick marks around the dial.
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (r - 10), cy + Math.sin(a) * (r - 10));
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  }
  // The spinning pointer.
  ctx.strokeStyle = dial.flash > 0 ? '#e03e34' : '#f2c14e';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(dial.pointer) * (r - 4), cy + Math.sin(dial.pointer) * (r - 4));
  ctx.stroke();
  ctx.fillStyle = '#e8e4d8';
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fill();
  // Tumbler pips.
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = dial.locked[i] ? '#7fd08a' : '#3a3f4d';
    ctx.beginPath();
    ctx.arc(cx - 30 + i * 30, cy + r + 52, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#e8e4d8';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Tumbler ${dial.tumbler + 1} of 3 — press E inside the green`, cx, cy - r - 44);
  ctx.fillStyle = '#9aa1b0';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('A miss costs +10 alarm.  Esc walks away.', cx, cy + r + 78);
}
