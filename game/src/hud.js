// Sapphire Heist v2 — the HUD bar, prompts, banners, the crack timing bar
// and every screen: title, how-to, pause, win, caught, lockdown, timeout.
// All canvas-drawn, so each screen shows up in a screenshot exactly as the
// player sees it.
import { CFG } from './config.js';

function alarmColor(v) {
  if (v < 40) return '#35d07f';
  if (v < 70) return '#f2c14e';
  return '#e05252';
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function drawHud(ctx, game) {
  const W = CFG.W;
  ctx.fillStyle = 'rgba(10, 12, 18, 0.88)';
  ctx.fillRect(0, 0, W, 30);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';

  // Objective, left.
  ctx.fillStyle = '#8a91a3';
  ctx.fillText('JOB', 10, 19);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = '12px sans-serif';
  ctx.fillText(game.objective(), 44, 19);

  // Alarm meter, centre-left.
  const mx = 380;
  ctx.fillStyle = '#e8e4d8';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('ALARM', mx, 19);
  ctx.fillStyle = '#20242e';
  ctx.fillRect(mx + 48, 8, 130, 14);
  ctx.fillStyle = alarmColor(game.alarm);
  ctx.fillRect(mx + 48, 8, Math.max(0, (game.alarm / 100) * 130), 14);
  ctx.strokeStyle = '#5a6276';
  ctx.lineWidth = 1;
  ctx.strokeRect(mx + 48, 8, 130, 14);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(`${Math.round(game.alarm)}%`, mx + 184, 19);

  // Hearts, loot, timer, right.
  let hx = 600;
  for (let i = 0; i < CFG.hearts; i += 1) {
    ctx.fillStyle = i < game.player.hearts ? '#e05252' : 'rgba(224,82,82,0.25)';
    ctx.beginPath();
    ctx.arc(hx + i * 20 + 6, 15, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#f2c14e';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`◆ ${game.score}`, 668, 19);
  ctx.fillStyle = game.timeLeft < 60 ? '#e05252' : '#e8e4d8';
  ctx.fillText(`◷ ${formatTime(game.timeLeft)}`, 740, 19);
  const camsOff = game.time < game.camerasOfflineUntil;
  ctx.fillStyle = camsOff ? '#35d07f' : '#8a91a3';
  ctx.fillText(camsOff ? 'CAM OFF' : (game.player.hasKeycard ? 'KEY ✓' : 'KEY ✗'), 812, 19);

  // Context prompt, bottom centre.
  if (game.prompt) {
    ctx.font = 'bold 13px sans-serif';
    const w = ctx.measureText(game.prompt).width + 24;
    ctx.fillStyle = 'rgba(10, 12, 18, 0.85)';
    ctx.fillRect((W - w) / 2, CFG.H - 34, w, 26);
    ctx.strokeStyle = '#8a6d2f';
    ctx.lineWidth = 1;
    ctx.strokeRect((W - w) / 2, CFG.H - 34, w, 26);
    ctx.fillStyle = '#f2c14e';
    ctx.textAlign = 'center';
    ctx.fillText(game.prompt, W / 2, CFG.H - 16);
    ctx.textAlign = 'left';
  }

  // Banner, upper centre.
  if (game.banner && game.time < game.banner.until) {
    ctx.font = 'bold 20px sans-serif';
    const w = ctx.measureText(game.banner.text).width + 36;
    ctx.fillStyle = 'rgba(10, 12, 18, 0.82)';
    ctx.fillRect((W - w) / 2, 52, w, game.banner.sub ? 56 : 34);
    ctx.strokeStyle = '#8a6d2f';
    ctx.strokeRect((W - w) / 2, 52, w, game.banner.sub ? 56 : 34);
    ctx.fillStyle = '#f2c14e';
    ctx.textAlign = 'center';
    ctx.fillText(game.banner.text, W / 2, 76);
    if (game.banner.sub) {
      ctx.fillStyle = '#e8e4d8';
      ctx.font = '13px sans-serif';
      ctx.fillText(game.banner.sub, W / 2, 97);
    }
    ctx.textAlign = 'left';
  }

  // Hack channel progress, above the terminal prompt area.
  if (game.hack.active) {
    const bw = 220;
    const bx = (W - bw) / 2;
    const by = CFG.H - 68;
    ctx.fillStyle = 'rgba(10, 12, 18, 0.85)';
    ctx.fillRect(bx - 10, by - 20, bw + 20, 34);
    ctx.fillStyle = '#20242e';
    ctx.fillRect(bx, by, bw, 12);
    ctx.fillStyle = '#35d07f';
    ctx.fillRect(bx, by, bw * (game.hack.progress / CFG.cameraHackSecs), 12);
    ctx.fillStyle = '#e8e4d8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HACKING CAMERAS…', W / 2, by - 6);
    ctx.textAlign = 'left';
  }

  // Crack minigame timing bar, bottom centre.
  if (game.crack.active) {
    const bw = 320;
    const bx = (W - bw) / 2;
    const by = CFG.H - 92;
    ctx.fillStyle = 'rgba(10, 12, 18, 0.9)';
    ctx.fillRect(bx - 12, by - 30, bw + 24, 62);
    ctx.strokeStyle = '#8a6d2f';
    ctx.strokeRect(bx - 12, by - 30, bw + 24, 62);
    ctx.fillStyle = '#e8e4d8';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`CRACK THE CASE — ${game.crack.hits}/${CFG.crackHitsNeeded}`, W / 2, by - 12);
    // Green zone.
    const zx = bx + ((game.crack.zone + 1) / 2) * bw;
    const zw = CFG.crackGreenHalf * bw;
    ctx.fillStyle = '#35d07f';
    ctx.fillRect(zx - zw / 2, by, zw, 16);
    // Track.
    ctx.fillStyle = '#20242e';
    ctx.fillRect(bx, by, bw, 16);
    ctx.fillStyle = '#35d07f';
    ctx.fillRect(zx - zw / 2, by, zw, 16);
    // Needle.
    const nx = bx + ((Math.sin(game.crack.needle) + 1) / 2) * bw;
    ctx.fillStyle = '#f2c14e';
    ctx.fillRect(nx - 2, by - 4, 4, 24);
    ctx.fillStyle = '#e8e4d8';
    ctx.font = '11px sans-serif';
    ctx.fillText('Press E in the green', W / 2, by + 28);
    ctx.textAlign = 'left';
  }
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(5, 6, 10, 0.78)';
  ctx.fillRect(0, 0, CFG.W, CFG.H);
}

function centred(ctx, y, text, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, CFG.W / 2, y);
  ctx.textAlign = 'left';
}

export function drawTitle(ctx, game) {
  dim(ctx);
  centred(ctx, 130, 'SAPPHIRE HEIST', 'bold 44px sans-serif', '#f2c14e');
  centred(ctx, 162, '— The Meridian Museum Job —', '16px sans-serif', '#4fd2ff');
  centred(ctx, 210, 'One thief. Four guards. Three cameras. One Star Sapphire.', '15px sans-serif', '#e8e4d8');
  const lines = [
    'Lift the KEYCARD from the security room, unlock the vault,',
    'crack the sapphire case — then walk out the front door.',
    '',
    'WASD / arrows — move      Shift — sneak (slower, harder to spot)',
    'E — interact / crack      Click — walk there      P — pause      M — mute',
    '',
    'Guards hunt you when their suspicion fills. Cameras feed the alarm.',
    'Hack the security terminal to knock the cameras dark for 40s.',
    'Alarm at 100% locks the museum down. Three catches ends the job.',
  ];
  lines.forEach((l, i) => centred(ctx, 250 + i * 24, l, l === '' ? '13px sans-serif' : '14px sans-serif', '#9aa1b0'));
  const pulse = 0.6 + 0.4 * Math.sin(game.time * 3);
  ctx.save();
  ctx.globalAlpha = pulse;
  centred(ctx, 545, 'Press ENTER to start the job', 'bold 18px sans-serif', '#35d07f');
  ctx.restore();
}

export function drawPaused(ctx, game) {
  dim(ctx);
  centred(ctx, 260, 'PAUSED', 'bold 36px sans-serif', '#e8e4d8');
  centred(ctx, 300, 'P — resume      R — restart the job', '15px sans-serif', '#9aa1b0');
}

function drawEnd(ctx, title, titleColor, lines, scoreLines) {
  dim(ctx);
  centred(ctx, 170, title, 'bold 40px sans-serif', titleColor);
  lines.forEach((l, i) => centred(ctx, 220 + i * 26, l, '15px sans-serif', '#e8e4d8'));
  if (scoreLines) {
    let y = 220 + lines.length * 26 + 20;
    scoreLines.forEach(([label, value]) => {
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#9aa1b0';
      ctx.textAlign = 'right';
      ctx.fillText(label, CFG.W / 2 - 10, y);
      ctx.fillStyle = '#f2c14e';
      ctx.textAlign = 'left';
      ctx.fillText(String(value), CFG.W / 2 + 10, y);
      y += 26;
    });
    ctx.textAlign = 'left';
  }
  centred(ctx, 520, 'Press R to run it back', 'bold 16px sans-serif', '#35d07f');
}

export function drawEndScreen(ctx, game) {
  if (game.phase === 'win') {
    drawEnd(ctx, 'CLEAN GETAWAY', '#35d07f',
      ['The Star Sapphire is yours. The Meridian Museum never saw you coming.'],
      [...game.finalBreakdown, ['TOTAL', game.finalScore]]);
  } else if (game.phase === 'caught') {
    drawEnd(ctx, 'CAUGHT', '#e05252',
      ['Three strikes — the guards dragged you out in cuffs.', `Loot kept: ◆ ${game.score}`]);
  } else if (game.phase === 'lockdown') {
    drawEnd(ctx, 'LOCKDOWN', '#e05252',
      ['The alarm hit 100%. Steel shutters, armed response, no way out.', `Loot kept: ◆ ${game.score}`]);
  } else if (game.phase === 'timeout') {
    drawEnd(ctx, 'TOO SLOW', '#e05252',
      ['Five minutes gone — the police cordon arrived before you did.', `Loot kept: ◆ ${game.score}`]);
  }
}
