// NEON VAULT — The Golden Chip Job: canvas rendering.
// Draws the casino the way the judge sees it: neon zones, slot machines
// and tables the thief hides behind, guards with their vision cones,
// camera beams, the loot target and the vault. The cover screenshot is
// the game's first impression, so the render keeps every one of those
// readable in a single frame.

import { WORLD, VIEW, PALETTE, GUARD, CAMERA } from './config.js';
import { ZONES, WALLS, COVER, DOORS, KEYCARD, CAGE_PANEL, VAULT, LOOT, ESCAPE } from './level.js';

export function cameraFor(player) {
  const x = Math.max(0, Math.min(WORLD.w - VIEW.w, player.x - VIEW.w / 2));
  const y = Math.max(0, Math.min(WORLD.h - VIEW.h, player.y - VIEW.h / 2));
  return { x, y };
}

export function render(ctx, g) {
  const cam = cameraFor(g.player);
  ctx.save();
  if (g.shake > 0) {
    ctx.translate((Math.random() - 0.5) * 10 * g.shake, (Math.random() - 0.5) * 10 * g.shake);
  }
  ctx.translate(-cam.x, -cam.y);

  drawFloor(ctx);
  drawEscape(ctx);
  drawLoot(ctx);
  drawKeycard(ctx, g);
  drawPanel(ctx, g);
  drawVault(ctx, g);
  drawCover(ctx);
  drawWalls(ctx);
  drawDoors(ctx);
  drawSmokes(ctx, g);
  drawCameras(ctx, g);
  drawGuards(ctx, g);
  drawPlayer(ctx, g);
  drawParticles(ctx, g);
  ctx.restore();

  // Night vignette over the whole view.
  const vg = ctx.createRadialGradient(
    VIEW.w / 2, VIEW.h / 2, VIEW.h * 0.35,
    VIEW.w / 2, VIEW.h / 2, VIEW.h * 0.75,
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(5,2,10,0.55)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  if (g.flash > 0) {
    ctx.fillStyle = `rgba(255,60,60,${g.flash * 0.5})`;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  }
}

function drawFloor(ctx) {
  for (const z of ZONES) {
    ctx.fillStyle = PALETTE[z.floor];
    ctx.fillRect(z.x, z.y, z.w, z.h);
    // Zone label, dim, so the rooms read at a glance.
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(z.label, z.x + 14, z.y + 24);
  }
  // Neon strip along the gambling floor's edge.
  ctx.fillStyle = PALETTE.neonPink;
  ctx.fillRect(0, 296, WORLD.w, 3);
  ctx.fillStyle = PALETTE.neonCyan;
  ctx.fillRect(0, 656, WORLD.w, 3);
}

function drawEscape(ctx) {
  ctx.fillStyle = PALETTE.garageExit;
  ctx.fillRect(ESCAPE.x - 46, ESCAPE.y - 30, 92, 60);
  ctx.strokeStyle = '#7fd08a';
  ctx.lineWidth = 2;
  ctx.strokeRect(ESCAPE.x - 46, ESCAPE.y - 30, 92, 60);
  ctx.fillStyle = '#d8ffe0';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', ESCAPE.x, ESCAPE.y + 5);
}

function drawLoot(ctx) {
  for (const l of LOOT) {
    if (l.taken) continue;
    const bob = Math.sin(Date.now() / 300 + l.x) * 2;
    if (l.kind === 'chip') {
      ctx.fillStyle = PALETTE.lootChip;
      ctx.beginPath();
      ctx.arc(l.x, l.y + bob, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(l.x, l.y + bob, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (l.kind === 'cash') {
      ctx.fillStyle = PALETTE.lootCash;
      ctx.fillRect(l.x - 11, l.y - 7 + bob, 22, 14);
      ctx.fillStyle = '#0d3a14';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', l.x, l.y + 3 + bob);
    } else {
      ctx.fillStyle = PALETTE.lootGold;
      ctx.beginPath();
      ctx.moveTo(l.x - 12, l.y + 6 + bob);
      ctx.lineTo(l.x - 8, l.y - 6 + bob);
      ctx.lineTo(l.x + 8, l.y - 6 + bob);
      ctx.lineTo(l.x + 12, l.y + 6 + bob);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawKeycard(ctx, g) {
  if (g.hasKeycard || KEYCARD.taken) return;
  const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 250);
  ctx.fillStyle = `rgba(46,230,255,${0.25 * pulse})`;
  ctx.beginPath();
  ctx.arc(KEYCARD.x, KEYCARD.y, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.keycard;
  ctx.fillRect(KEYCARD.x - 10, KEYCARD.y - 6, 20, 12);
  ctx.fillStyle = '#062a33';
  ctx.font = 'bold 8px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VIP', KEYCARD.x, KEYCARD.y + 3);
}

function drawPanel(ctx, g) {
  if (g.cageOff || CAGE_PANEL.disabled) return;
  const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 250);
  ctx.fillStyle = `rgba(125,255,94,${0.25 * pulse})`;
  ctx.beginPath();
  ctx.arc(CAGE_PANEL.x, CAGE_PANEL.y, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7dff5e';
  ctx.fillRect(CAGE_PANEL.x - 8, CAGE_PANEL.y - 8, 16, 16);
  ctx.fillStyle = '#0d2a06';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('!', CAGE_PANEL.x, CAGE_PANEL.y + 4);
}

function drawVault(ctx, g) {
  const x = VAULT.x;
  const y = VAULT.y;
  ctx.fillStyle = g.jackpot ? PALETTE.vaultOpen : PALETTE.vault;
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.neonGold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#3a2c10';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 18);
  ctx.lineTo(x, y + 18);
  ctx.moveTo(x - 18, y);
  ctx.lineTo(x + 18, y);
  ctx.stroke();
  ctx.fillStyle = PALETTE.neonGold;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(g.jackpot ? 'OPEN' : 'JACKPOT', x, y - 40);
}

function drawCover(ctx) {
  for (const c of COVER) {
    if (c.kind === 'slot') {
      ctx.fillStyle = PALETTE.coverSlot;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = PALETTE.neonPink;
      ctx.fillRect(c.x + 6, c.y + 6, c.w - 12, 12);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('777', c.x + c.w / 2, c.y + 15);
      ctx.fillStyle = PALETTE.neonCyan;
      ctx.fillRect(c.x + 10, c.y + c.h - 12, c.w - 20, 4);
    } else if (c.kind === 'table') {
      ctx.fillStyle = PALETTE.coverTable;
      ctx.beginPath();
      ctx.ellipse(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.neonGold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(c.x + c.w / 2, c.y + c.h / 2, c.w / 2 - 6, c.h / 2 - 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (c.kind === 'roulette') {
      ctx.fillStyle = PALETTE.coverRoulette;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c22';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (c.kind === 'car') {
      ctx.fillStyle = PALETTE.coverCar;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = '#3d4454';
      ctx.fillRect(c.x + 18, c.y + 8, c.w - 36, c.h - 16);
      ctx.fillStyle = '#ffd23e';
      ctx.fillRect(c.x + c.w - 6, c.y + 10, 4, 10);
      ctx.fillRect(c.x + c.w - 6, c.y + c.h - 20, 4, 10);
    } else if (c.kind === 'couch') {
      ctx.fillStyle = PALETTE.coverCouch;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = '#7a2a52';
      ctx.fillRect(c.x + 8, c.y + 8, c.w - 16, 10);
    } else if (c.kind === 'bar') {
      ctx.fillStyle = PALETTE.coverBar;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = PALETTE.neonGold;
      ctx.fillRect(c.x, c.y, c.w, 4);
    } else {
      ctx.fillStyle = '#3d2a10';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = PALETTE.neonGold;
      ctx.fillRect(c.x, c.y, c.w, 3);
    }
  }
}

function drawWalls(ctx) {
  for (const w of WALLS) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wallTrim;
    if (w.h <= 16) ctx.fillRect(w.x, w.y, w.w, 2);
    else ctx.fillRect(w.x, w.y, 2, w.h);
  }
}

function drawDoors(ctx) {
  for (const d of DOORS) {
    ctx.fillStyle = d.locked ? PALETTE.doorLocked : PALETTE.doorOpen;
    ctx.fillRect(d.x, d.y, d.w, d.h);
    if (d.locked) {
      ctx.fillStyle = '#ffd23e';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VIP', d.x + d.w / 2, d.y + d.h / 2 - 14);
    }
  }
}

function drawSmokes(ctx, g) {
  for (const s of g.smokes) {
    ctx.fillStyle = PALETTE.smoke;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCameras(ctx, g) {
  for (const c of g.cameras) {
    if (c.dark > 0) {
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    // Beam: a wedge from the mount along its angle.
    ctx.fillStyle = PALETTE.cameraBeam;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.arc(c.x, c.y, CAMERA.range, c.angle - CAMERA.halfAngle, c.angle + CAMERA.halfAngle);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff3c3c';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGuards(ctx, g) {
  for (const guard of g.guards) {
    const chasing = guard.state === 'chase';
    // Vision cone.
    ctx.fillStyle = chasing ? PALETTE.guardConeChase : PALETTE.guardCone;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.arc(
      guard.x, guard.y, GUARD.sightRange,
      guard.facing - GUARD.sightHalfAngle, guard.facing + GUARD.sightHalfAngle,
    );
    ctx.closePath();
    ctx.fill();
    // Body.
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = chasing ? '#ff3c3c' : '#7fb2e8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
    ctx.stroke();
    // Facing tick.
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(
      guard.x + Math.cos(guard.facing) * (GUARD.radius + 6),
      guard.y + Math.sin(guard.facing) * (GUARD.radius + 6),
    );
    ctx.stroke();
    // Suspicion arc above the head.
    if (guard.suspicion > 0.05 && guard.state === 'patrol') {
      ctx.strokeStyle = '#ffd23e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y - GUARD.radius - 8, 7, -Math.PI / 2, -Math.PI / 2 + guard.suspicion * Math.PI * 2);
      ctx.stroke();
    }
    if (chasing) {
      ctx.fillStyle = '#ff3c3c';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - GUARD.radius - 10);
    }
  }
}

function drawPlayer(ctx, g) {
  const p = g.player;
  const bobY = Math.sin(p.bob) * (p.sneaking ? 1 : 2);
  ctx.fillStyle = PALETTE.playerGlow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(p.x, p.y + bobY, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.playerTrim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y + bobY, 13, 0, Math.PI * 2);
  ctx.stroke();
  // Facing tick and a gold tie.
  ctx.strokeStyle = PALETTE.playerTrim;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y + bobY);
  ctx.lineTo(p.x + Math.cos(p.facing) * 18, p.y + bobY + Math.sin(p.facing) * 18);
  ctx.stroke();
  if (p.sneaking) {
    ctx.fillStyle = '#9aa1b0';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('sneak', p.x, p.y + 26);
  }
}

function drawParticles(ctx, g) {
  for (const pt of g.particles) {
    ctx.fillStyle = pt.color;
    ctx.globalAlpha = Math.max(0, pt.left / 0.6);
    ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;
}
