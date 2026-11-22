// hud.js — the top bar (alarm meter, loot, timer, score), alert banners and
// the title / caught / lockdown / win screens. All canvas-drawn, so every
// screen shows up in a screenshot exactly as the player sees it.

import { ALARM, CANVAS, COLORS } from './config.js';
import { LOOT_SPOTS } from './level.js';

function alarmColor(value) {
  if (value < 40) return COLORS.alarmLow;
  if (value < 70) return COLORS.alarmMid;
  return COLORS.alarmHigh;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function drawHud(ctx, state) {
  const bar = { x: 0, y: 0, width: CANVAS.width, height: 26 };
  ctx.fillStyle = COLORS.hudBack;
  ctx.fillRect(bar.x, bar.y, bar.width, bar.height);

  // Alarm meter: label + bar, left side.
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', 10, 17);
  const meter = { x: 62, y: 6, width: 210, height: 14 };
  ctx.fillStyle = '#22262f';
  ctx.fillRect(meter.x, meter.y, meter.width, meter.height);
  ctx.fillStyle = alarmColor(state.alarm);
  ctx.fillRect(meter.x, meter.y, (meter.width * state.alarm) / ALARM.max, meter.height);
  ctx.strokeStyle = 'rgba(232,228,216,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(meter.x, meter.y, meter.width, meter.height);
  ctx.fillStyle = COLORS.text;
  ctx.font = '11px sans-serif';
  ctx.fillText(`${Math.round(state.alarm)}%`, meter.x + meter.width + 8, 17);

  // Loot chips: sapphire, gold x2, intel — filled once taken.
  let chipX = 360;
  for (const spot of LOOT_SPOTS) {
    const taken = state.loot[spot.id];
    ctx.fillStyle = taken ? '#2c3140' : '#171a21';
    ctx.beginPath();
    ctx.arc(chipX + 8, 13, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = taken ? COLORS.gold : '#4a4f5c';
    ctx.stroke();
    ctx.fillStyle = taken ? COLORS.gold : '#5c6270';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    const glyph = spot.kind === 'sapphire' ? '◆' : spot.kind === 'goldBar' ? '●' : '▤';
    ctx.fillText(glyph, chipX + 8, 17);
    chipX += 24;
  }
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('LOOT', 330, 17);

  // Timer + score, right side.
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(formatTime(state.elapsed), CANVAS.width - 120, 17);
  ctx.fillText(`SCORE ${state.score}`, CANVAS.width - 10, 17);

  // Alert banner while a guard hunts or a camera locks on.
  const hunting = state.guards.some((g) => g.state === 'hunt');
  const locked = state.cameras.some((c) => c.locked);
  if (state.phase === 'playing' && (hunting || locked)) {
    const text = hunting ? 'SPOTTED — BREAK LINE OF SIGHT!' : 'CAMERA LOCK — GET OUT OF THE BEAM!';
    ctx.font = 'bold 15px sans-serif';
    const w = ctx.measureText(text).width + 24;
    ctx.fillStyle = 'rgba(120, 20, 20, 0.9)';
    ctx.fillRect((CANVAS.width - w) / 2, 34, w, 26);
    ctx.fillStyle = '#ffe9e9';
    ctx.textAlign = 'center';
    ctx.fillText(text, CANVAS.width / 2, 52);
  }

  // Bottom help line.
  ctx.fillStyle = 'rgba(10, 12, 18, 0.75)';
  ctx.fillRect(0, CANVAS.height - 22, CANVAS.width, 22);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    'WASD / arrows move · Shift sneak · Click to walk · M mute · P pause · R retry',
    CANVAS.width / 2,
    CANVAS.height - 7,
  );
}

function dimScreen(ctx) {
  ctx.fillStyle = 'rgba(8, 10, 15, 0.78)';
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
}

function screenTitle(ctx, title, lines, accent) {
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, CANVAS.width / 2, 190);
  ctx.fillStyle = COLORS.text;
  ctx.font = '16px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, CANVAS.width / 2, 240 + i * 28);
  });
}

export function drawTitleScreen(ctx, state) {
  dimScreen(ctx);
  ctx.fillStyle = COLORS.sapphire;
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MIDNIGHT VAULT', CANVAS.width / 2, 150);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('— The Star Sapphire Job —', CANVAS.width / 2, 186);
  ctx.fillStyle = COLORS.text;
  ctx.font = '16px sans-serif';
  const lines = [
    'One vault hall. Three guards, two cameras, one sapphire.',
    'Slip past the cones, crack the case, grab the Star Sapphire,',
    'and walk out the green EXIT before the alarm hits 100%.',
    '',
    'WASD / arrows to move · Shift to sneak · Click to walk there',
    'Gold bars and the vault ledger are optional — but they pay.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, CANVAS.width / 2, 232 + i * 26));
  ctx.fillStyle = COLORS.exitGlow;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(state.startFlash ? 'PRESS ENTER OR CLICK TO START' : '', CANVAS.width / 2, 430);
}

export function drawEndScreen(ctx, state) {
  dimScreen(ctx);
  if (state.phase === 'win') {
    const bonus = Math.max(0, Math.round((240 - state.elapsed) * 2));
    screenTitle(
      ctx,
      'CLEAN GETAWAY!',
      [
        `You lifted the Star Sapphire and walked out the EXIT.`,
        `Loot ${state.score - bonus} · speed bonus ${bonus} · time ${formatTime(state.elapsed)}`,
        `Final score: ${state.score}`,
        '',
        'Press R to run the job again.',
      ],
      COLORS.exitGlow,
    );
  } else if (state.phase === 'caught') {
    screenTitle(
      ctx,
      'CAUGHT!',
      [
        'A guard got his hands on you. The sapphire stays in the vault.',
        `Score ${state.score} · time ${formatTime(state.elapsed)}`,
        '',
        'Tip: watch the cones, sneak with Shift, break line of sight.',
        'Press R to try the job again.',
      ],
      COLORS.alarmHigh,
    );
  } else if (state.phase === 'lockdown') {
    screenTitle(
      ctx,
      'LOCKDOWN!',
      [
        'The alarm hit 100% — steel shutters, sirens, nowhere to run.',
        `Score ${state.score} · time ${formatTime(state.elapsed)}`,
        '',
        'Tip: cameras feed the alarm too. Cross their beams only when the lens swings away.',
        'Press R to try the job again.',
      ],
      COLORS.alarmHigh,
    );
  } else if (state.phase === 'paused') {
    screenTitle(ctx, 'PAUSED', ['The job waits. Press P to keep going.'], COLORS.textDim);
  }
}
