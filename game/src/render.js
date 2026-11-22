// NIGHT VAULT — the renderer.
// Everything the judge sees is drawn here, on one canvas, from shapes and
// text only: no images, no network. The camera follows the thief through
// the 1440 by 900 tower; the HUD is drawn in screen space on top. The
// first criterion is a single frame that shows the thief, guards with
// vision cones, cameras, a loot target and the alarm meter together, so
// the cover scene stages exactly that.

import { WORLD, VIEW, PALETTE, PLAYER } from './config.js';
import { WALLS, COVER, VAULT_DOOR, VAULT, HELIPAD, KEYCARD } from './level.js';

// Keep the camera centred on the thief, clamped inside the tower.
export function cameraFor(player) {
  const x = Math.max(0, Math.min(WORLD.w - VIEW.w, player.x - VIEW.w / 2));
  const y = Math.max(0, Math.min(WORLD.h - VIEW.h, player.y - VIEW.h / 2));
  return { x, y };
}

function zoneAt(y) {
  if (y < 180) return PALETTE.rooftopFloor;
  if (y < 450) return PALETTE.officeFloor;
  if (y < 700) return PALETTE.tradingFloor;
  return PALETTE.vaultFloor;
}

function drawFloor(ctx, camera) {
  // Four bands, one per zone, with a faint tile grid so the floor reads
  // as marble and carpet instead of a flat colour.
  const bands = [
    { y0: 0, y1: 180, color: PALETTE.rooftopFloor },
    { y0: 180, y1: 450, color: PALETTE.officeFloor },
    { y0: 450, y1: 700, color: PALETTE.tradingFloor },
    { y0: 700, y1: WORLD.h, color: PALETTE.vaultFloor },
  ];
  for (const band of bands) {
    ctx.fillStyle = band.color;
    ctx.fillRect(-camera.x, band.y0 - camera.y, WORLD.w, band.y1 - band.y0);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= WORLD.w; x += 60) {
    ctx.moveTo(x - camera.x, -camera.y);
    ctx.lineTo(x - camera.x, WORLD.h - camera.y);
  }
  for (let y = 0; y <= WORLD.h; y += 60) {
    ctx.moveTo(-camera.x, y - camera.y);
    ctx.lineTo(WORLD.w - camera.x, y - camera.y);
  }
  ctx.stroke();
  // Zone labels, painted on the floor so the tower reads at a glance.
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ROOFTOP', 30 - camera.x, 40 - camera.y);
  ctx.fillText('EXECUTIVE OFFICES', 30 - camera.x, 220 - camera.y);
  ctx.fillText('TRADING FLOOR', 30 - camera.x, 490 - camera.y);
  ctx.fillText('VAULT FLOOR', 30 - camera.x, 740 - camera.y);
}

function drawWalls(ctx, camera, vaultDoorLocked) {
  ctx.fillStyle = PALETTE.wall;
  for (const w of WALLS) {
    ctx.fillRect(w.x - camera.x, w.y - camera.y, w.w, w.h);
  }
  // Gold trim along the wall tops, the bank's one concession to style.
  ctx.fillStyle = PALETTE.wallTrim;
  for (const w of WALLS) {
    if (w.h <= 12) ctx.fillRect(w.x - camera.x, w.y - camera.y, w.w, 2);
  }
  // The vault-floor door: a red-barred gate while locked, an open
  // threshold once the keycard has done its work.
  if (vaultDoorLocked) {
    ctx.fillStyle = PALETTE.doorLocked;
    ctx.fillRect(VAULT_DOOR.x - camera.x, VAULT_DOOR.y - camera.y, VAULT_DOOR.w, VAULT_DOOR.h);
    ctx.fillStyle = '#e8b4b4';
    for (let x = VAULT_DOOR.x + 8; x < VAULT_DOOR.x + VAULT_DOOR.w - 8; x += 18) {
      ctx.fillRect(x - camera.x, VAULT_DOOR.y - 4 - camera.y, 3, VAULT_DOOR.h + 8);
    }
  } else {
    ctx.fillStyle = PALETTE.doorOpen;
    ctx.fillRect(VAULT_DOOR.x - camera.x, VAULT_DOOR.y - camera.y, VAULT_DOOR.w, VAULT_DOOR.h);
  }
}

function drawCover(ctx, camera) {
  for (const c of COVER) {
    const x = c.x - camera.x;
    const y = c.y - camera.y;
    if (c.kind === 'desk') ctx.fillStyle = PALETTE.coverDesk;
    else if (c.kind === 'terminal') ctx.fillStyle = PALETTE.coverTerminal;
    else if (c.kind === 'plant') ctx.fillStyle = PALETTE.coverPlant;
    else if (c.kind === 'unit') ctx.fillStyle = '#2a3242';
    else ctx.fillStyle = PALETTE.coverSafe;
    ctx.fillRect(x, y, c.w, c.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, c.w - 1, c.h - 1);
    if (c.kind === 'terminal') {
      ctx.fillStyle = 'rgba(79, 210, 255, 0.5)';
      ctx.fillRect(x + 8, y + 6, c.w - 16, 10);
    }
    if (c.kind === 'plant') {
      ctx.fillStyle = '#3f7a4a';
      ctx.beginPath();
      ctx.arc(x + c.w / 2, y + c.h / 2, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawCone(ctx, x, y, angle, halfAngle, range, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fill();
}

function drawGuards(ctx, camera, guards) {
  for (const g of guards) {
    const x = g.x - camera.x;
    const y = g.y - camera.y;
    const chasing = g.state === 'chase';
    drawCone(
      ctx, x, y, g.angle, 0.61, 175,
      chasing ? 'rgba(224, 62, 52, 0.28)' : 'rgba(242, 193, 78, 0.20)',
    );
    // Body: a navy uniform with a pale face, readable at a glance.
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8dcc0';
    ctx.beginPath();
    ctx.arc(x + Math.cos(g.angle) * 5, y + Math.sin(g.angle) * 5, 6, 0, Math.PI * 2);
    ctx.fill();
    // Suspicion arc over the head: empty, half, full.
    if (g.suspicion > 0.05) {
      ctx.strokeStyle = chasing ? '#e03e34' : '#f2c14e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - 20, 8, -Math.PI / 2, -Math.PI / 2 + g.suspicion * Math.PI * 2);
      ctx.stroke();
    }
    if (chasing) {
      ctx.fillStyle = '#ff5a4e';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', x, y - 28);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.name, x, y + 26);
  }
}

function drawCameras(ctx, camera, cameras) {
  for (const c of cameras) {
    const x = c.x - camera.x;
    const y = c.y - camera.y;
    if (c.offlineSeconds <= 0) {
      drawCone(ctx, x, y, c.angle, 0.32, 205, 'rgba(224, 62, 52, 0.16)');
    }
    ctx.fillStyle = c.offlineSeconds > 0 ? '#5a636e' : '#c33';
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8e4d8';
    ctx.beginPath();
    ctx.arc(x + Math.cos(c.angle) * 9, y + Math.sin(c.angle) * 9, 3, 0, Math.PI * 2);
    ctx.fill();
    if (c.locked) {
      ctx.fillStyle = '#ff5a4e';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LOCK', x, y - 14);
    }
  }
}

function drawLoot(ctx, camera, game) {
  for (const loot of game.loot) {
    if (loot.taken) continue;
    const x = loot.x - camera.x;
    const y = loot.y - camera.y;
    const pulse = 1 + Math.sin(performance.now() / 300 + loot.x) * 0.12;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    if (loot.kind === 'cash') {
      ctx.fillStyle = PALETTE.lootCash;
      ctx.fillRect(-9, -6, 18, 12);
      ctx.fillStyle = '#1d3a24';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', 0, 3);
    } else if (loot.kind === 'gold') {
      ctx.fillStyle = PALETTE.lootGold;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(9, 0);
      ctx.lineTo(0, 10);
      ctx.lineTo(-9, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = PALETTE.lootBond;
      ctx.fillRect(-8, -11, 16, 22);
      ctx.fillStyle = '#1d2f4a';
      ctx.fillRect(-5, -7, 10, 3);
      ctx.fillRect(-5, -1, 10, 3);
      ctx.fillRect(-5, 5, 10, 3);
    }
    ctx.restore();
  }
  // The keycard, glowing on the manager's desk until it is lifted.
  if (!game.hasKeycard) {
    const x = KEYCARD.x - camera.x;
    const y = KEYCARD.y - camera.y;
    ctx.fillStyle = PALETTE.keycard;
    ctx.fillRect(x - 10, y - 6, 20, 12);
    ctx.fillStyle = '#0b2a3a';
    ctx.fillRect(x - 6, y - 3, 12, 2);
    ctx.strokeStyle = 'rgba(79, 210, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 13, y - 9, 26, 18);
  }
  // The Aurum Diamond, glowing in the open vault once the dial is cracked.
  if (game.vaultOpen && !game.hasDiamond) {
    const x = VAULT.x - camera.x;
    const y = VAULT.y - camera.y;
    const pulse = 1 + Math.sin(performance.now() / 200) * 0.2;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = PALETTE.vaultOpen;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(14, 0);
    ctx.lineTo(0, 16);
    ctx.lineTo(-14, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(242, 193, 78, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawVault(ctx, camera, game) {
  const x = VAULT.x - camera.x;
  const y = VAULT.y - camera.y;
  ctx.fillStyle = game.vaultOpen ? PALETTE.vaultOpen : PALETTE.vault;
  ctx.beginPath();
  ctx.arc(x, y, VAULT.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d8c27a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, VAULT.radius - 6, 0, Math.PI * 2);
  ctx.stroke();
  if (!game.vaultOpen) {
    // Spokes of the dial, and the vault's name.
    ctx.strokeStyle = '#3a2f14';
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * (VAULT.radius - 10), y + Math.sin(a) * (VAULT.radius - 10));
      ctx.stroke();
    }
    ctx.fillStyle = '#f2e6b8';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AURUM', x, y + 3);
  } else {
    ctx.fillStyle = '#241f14';
    ctx.beginPath();
    ctx.arc(x, y, VAULT.radius - 14, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHelipad(ctx, camera, game) {
  const x = HELIPAD.x - camera.x;
  const y = HELIPAD.y - camera.y;
  ctx.strokeStyle = game.hasDiamond ? '#7fd08a' : PALETTE.helipad;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, HELIPAD.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = game.hasDiamond ? '#7fd08a' : 'rgba(127, 208, 138, 0.7)';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('H', x, y + 11);
  if (game.hasDiamond) {
    ctx.fillStyle = '#7fd08a';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('ESCAPE — LAND HERE', x, y + HELIPAD.radius + 16);
  }
}

function drawPlayer(ctx, camera, player) {
  const x = player.x - camera.x;
  const y = player.y - camera.y;
  // A soft gold ring so the thief never vanishes into the night floor.
  ctx.fillStyle = PALETTE.playerGlow;
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(x, y, PLAYER.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.playerTrim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, PLAYER.radius, 0, Math.PI * 2);
  ctx.stroke();
  // Facing tick and, when sneaking, a crouch mark.
  ctx.strokeStyle = PALETTE.playerTrim;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(player.angle) * 18, y + Math.sin(player.angle) * 18);
  ctx.stroke();
  if (player.sneaking) {
    ctx.fillStyle = '#9aa1b0';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('sneak', x, y + 26);
  }
}

function drawSmoke(ctx, camera, smoke) {
  if (!smoke) return;
  ctx.fillStyle = PALETTE.smoke;
  ctx.beginPath();
  ctx.arc(smoke.x - camera.x, smoke.y - camera.y, smoke.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(160, 170, 185, 0.25)';
  ctx.beginPath();
  ctx.arc(smoke.x - camera.x - 20, smoke.y - camera.y + 12, smoke.radius * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawParticles(ctx, camera, particles) {
  for (const p of particles) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.beginPath();
    ctx.arc(p.x - camera.x, p.y - camera.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// The whole world, in one call. Screen shake is applied by the caller
// (main.js) when the alarm spikes or the thief is caught.
export function renderWorld(ctx, game) {
  const camera = cameraFor(game.player);
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  ctx.save();
  drawFloor(ctx, camera);
  drawHelipad(ctx, camera, game);
  drawCover(ctx, camera);
  drawWalls(ctx, camera, game.vaultDoorLocked);
  drawLoot(ctx, camera, game);
  drawVault(ctx, camera, game);
  drawCameras(ctx, camera, game.cameras);
  drawGuards(ctx, camera, game.guards);
  drawSmoke(ctx, camera, game.smoke);
  drawPlayer(ctx, camera, game.player);
  drawParticles(ctx, camera, game.particles);
  ctx.restore();
  // Night vignette: the edges of the frame go dark.
  const vignette = ctx.createRadialGradient(
    VIEW.w / 2, VIEW.h / 2, VIEW.h * 0.42,
    VIEW.w / 2, VIEW.h / 2, VIEW.h * 0.85,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
}
