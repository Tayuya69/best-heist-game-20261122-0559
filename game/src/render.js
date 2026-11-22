// render.js — draws the vault hall on canvas: marble floor, red carpet,
// brass display cases, the safe wall, vision cones, cameras, loot and thief.
// Danger reads at a glance: yellow cones are guards, red cones are cameras,
// the sapphire glows blue, the EXIT glows green.

import { CANVAS, COLORS, HALL } from './config.js';
import { CARPET, COVER, EXIT_DOOR, LOOT_SPOTS } from './level.js';

function drawCone(ctx, ox, oy, heading, fov, range, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.arc(ox, oy, range, heading - fov / 2, heading + fov / 2);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx) {
  // Marble tiles in two tones, with a faint grout grid.
  const tile = 48;
  for (let y = HALL.y; y < HALL.y + HALL.height; y += tile) {
    for (let x = HALL.x; x < HALL.x + HALL.width; x += tile) {
      const even = ((x - HALL.x) / tile + (y - HALL.y) / tile) % 2 === 0;
      ctx.fillStyle = even ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = HALL.x; x <= HALL.x + HALL.width; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, HALL.y);
    ctx.lineTo(x, HALL.y + HALL.height);
    ctx.stroke();
  }
  for (let y = HALL.y; y <= HALL.y + HALL.height; y += tile) {
    ctx.beginPath();
    ctx.moveTo(HALL.x, y);
    ctx.lineTo(HALL.x + HALL.width, y);
    ctx.stroke();
  }
  // Red carpet runner with a brass edge, spawn to exit.
  ctx.fillStyle = COLORS.carpet;
  ctx.fillRect(CARPET.x, CARPET.y, CARPET.width, CARPET.height);
  ctx.strokeStyle = COLORS.carpetEdge;
  ctx.lineWidth = 3;
  ctx.strokeRect(CARPET.x, CARPET.y, CARPET.width, CARPET.height);
  ctx.strokeStyle = 'rgba(232, 178, 58, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(CARPET.x + 6, CARPET.y + 6, CARPET.width - 12, CARPET.height - 12);
}

function drawWalls(ctx) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, CANVAS.width, HALL.y);
  ctx.fillRect(0, HALL.y + HALL.height, CANVAS.width, HALL.y);
  ctx.fillRect(0, 0, HALL.x, CANVAS.height);
  ctx.fillRect(HALL.x + HALL.width, 0, HALL.x, CANVAS.height);
  ctx.fillStyle = COLORS.wallTop;
  ctx.fillRect(0, HALL.y - 4, CANVAS.width, 4);
  ctx.fillRect(0, HALL.y + HALL.height, CANVAS.width, 4);
  // Service door (spawn) and EXIT door in the bottom wall.
  ctx.fillStyle = '#5c5142';
  ctx.fillRect(66, HALL.y + HALL.height, 60, 22);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SERVICE', 96, HALL.y + HALL.height + 15);
}

function drawCover(ctx) {
  for (const rect of COVER) {
    if (rect.kind === 'case') {
      ctx.fillStyle = '#241d12';
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      ctx.fillStyle = COLORS.caseGlass;
      ctx.fillRect(rect.x + 4, rect.y + 4, rect.width - 8, rect.height - 8);
      ctx.strokeStyle = COLORS.caseFrame;
      ctx.lineWidth = 3;
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    } else if (rect.kind === 'desk') {
      ctx.fillStyle = COLORS.desk;
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      ctx.fillStyle = '#5d4226';
      ctx.fillRect(rect.x + 6, rect.y + 6, rect.width - 12, rect.height - 12);
      ctx.strokeStyle = '#2c1e10';
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    } else if (rect.kind === 'pillar') {
      ctx.fillStyle = COLORS.pillar;
      ctx.beginPath();
      ctx.arc(rect.x + 17, rect.y + 17, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#79819a';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (rect.kind === 'safe') {
      ctx.fillStyle = COLORS.safe;
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      ctx.strokeStyle = COLORS.caseFrame;
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const sx = rect.x + 8 + i * 58;
        ctx.strokeRect(sx, rect.y + 7, 46, 26);
        ctx.beginPath();
        ctx.arc(sx + 23, rect.y + 20, 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
}

function drawLoot(ctx, lootState, time) {
  for (const spot of LOOT_SPOTS) {
    const taken = lootState[spot.id];
    if (taken) continue;
    const pulse = 0.6 + 0.4 * Math.sin(time * 3 + spot.x);
    if (spot.kind === 'sapphire') {
      ctx.save();
      ctx.shadowColor = COLORS.sapphire;
      ctx.shadowBlur = 18 * pulse;
      ctx.fillStyle = COLORS.sapphire;
      ctx.beginPath();
      ctx.moveTo(spot.x, spot.y - 14);
      ctx.lineTo(spot.x + 12, spot.y);
      ctx.lineTo(spot.x, spot.y + 14);
      ctx.lineTo(spot.x - 12, spot.y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.moveTo(spot.x, spot.y - 8);
      ctx.lineTo(spot.x + 5, spot.y);
      ctx.lineTo(spot.x, spot.y + 8);
      ctx.lineTo(spot.x - 5, spot.y);
      ctx.closePath();
      ctx.fill();
    } else if (spot.kind === 'goldBar') {
      ctx.save();
      ctx.shadowColor = COLORS.gold;
      ctx.shadowBlur = 10 * pulse;
      ctx.fillStyle = COLORS.gold;
      ctx.beginPath();
      ctx.moveTo(spot.x - 12, spot.y + 6);
      ctx.lineTo(spot.x - 8, spot.y - 6);
      ctx.lineTo(spot.x + 8, spot.y - 6);
      ctx.lineTo(spot.x + 12, spot.y + 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = COLORS.intel;
      ctx.fillRect(spot.x - 9, spot.y - 12, 18, 24);
      ctx.strokeStyle = '#8a8578';
      ctx.lineWidth = 1;
      ctx.strokeRect(spot.x - 9, spot.y - 12, 18, 24);
      ctx.strokeStyle = '#4a6fa5';
      ctx.beginPath();
      ctx.moveTo(spot.x - 5, spot.y - 5);
      ctx.lineTo(spot.x + 5, spot.y - 5);
      ctx.moveTo(spot.x - 5, spot.y);
      ctx.lineTo(spot.x + 5, spot.y);
      ctx.moveTo(spot.x - 5, spot.y + 5);
      ctx.lineTo(spot.x + 2, spot.y + 5);
      ctx.stroke();
    }
  }
}

function drawExit(ctx, hasSapphire, time) {
  const glow = hasSapphire ? 0.5 + 0.5 * Math.sin(time * 4) : 0.25;
  ctx.save();
  ctx.shadowColor = COLORS.exitGlow;
  ctx.shadowBlur = 22 * glow + 6;
  ctx.fillStyle = COLORS.exit;
  ctx.fillRect(EXIT_DOOR.x, EXIT_DOOR.y, EXIT_DOOR.width, EXIT_DOOR.height);
  ctx.restore();
  ctx.strokeStyle = COLORS.exitGlow;
  ctx.lineWidth = 3;
  ctx.strokeRect(EXIT_DOOR.x, EXIT_DOOR.y, EXIT_DOOR.width, EXIT_DOOR.height);
  ctx.fillStyle = '#eafff3';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', EXIT_DOOR.x + 30, EXIT_DOOR.y + 30);
  ctx.font = 'bold 8px sans-serif';
  ctx.fillText(hasSapphire ? 'GO!' : 'NEED', EXIT_DOOR.x + 30, EXIT_DOOR.y + 44);
  if (!hasSapphire) ctx.fillText('SAPPHIRE', EXIT_DOOR.x + 30, EXIT_DOOR.y + 55);
}

function drawCameras(ctx, cameras) {
  for (const cam of cameras) {
    drawCone(ctx, cam.x, cam.y, cam.angle, 0.91, 235, COLORS.cameraCone, COLORS.cameraConeEdge);
    ctx.fillStyle = cam.locked ? '#ff5d5d' : '#3a3f4d';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = cam.locked ? '#ff8a8a' : '#9aa1b0';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = cam.locked ? '#ff5d5d' : '#c8cdd8';
    ctx.beginPath();
    ctx.arc(cam.x + Math.cos(cam.angle) * 12, cam.y + Math.sin(cam.angle) * 12, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGuards(ctx, guards) {
  for (const guard of guards) {
    const hunting = guard.state === 'hunt';
    const suspicious = guard.state === 'suspicious';
    drawCone(
      ctx,
      guard.x,
      guard.y,
      guard.heading,
      1.26,
      215,
      hunting ? 'rgba(224, 82, 82, 0.28)' : COLORS.cone,
      hunting ? 'rgba(224, 82, 82, 0.7)' : COLORS.coneEdge,
    );
    // Body: dark uniform, brass buttons, cap.
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hunting ? '#ff8a8a' : COLORS.guardTrim;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = COLORS.guardTrim;
    ctx.beginPath();
    ctx.arc(guard.x + Math.cos(guard.heading) * 6, guard.y + Math.sin(guard.heading) * 6, 4, 0, Math.PI * 2);
    ctx.fill();
    // Name tag + suspicion arc over the head.
    ctx.fillStyle = guard.color;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(guard.name.toUpperCase(), guard.x, guard.y - 20);
    if (guard.suspicion > 1) {
      ctx.strokeStyle = suspicious || hunting ? '#ff5d5d' : COLORS.gold;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, 19, -Math.PI / 2, -Math.PI / 2 + (guard.suspicion / 100) * Math.PI * 2);
      ctx.stroke();
    }
    if (hunting) {
      ctx.fillStyle = '#ff5d5d';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('!', guard.x, guard.y - 32);
    } else if (suspicious) {
      ctx.fillStyle = COLORS.gold;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('?', guard.x, guard.y - 32);
    }
  }
}

function drawPlayer(ctx, player, time) {
  const bob = player.moving ? Math.sin(time * 12) * 1.5 : 0;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 10, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: black suit, gold trim, domino mask.
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.thiefTrim;
  ctx.lineWidth = 2;
  ctx.stroke();
  const fx = Math.cos(player.facing);
  const fy = Math.sin(player.facing);
  ctx.fillStyle = COLORS.thiefTrim;
  ctx.beginPath();
  ctx.arc(player.x + fx * 7, player.y + fy * 7 + bob, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Mask bar across the eyes.
  ctx.strokeStyle = '#0a0a0e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(player.x - fy * 7 + fx * 2, player.y + fx * 7 + fy * 2 + bob);
  ctx.lineTo(player.x + fy * 7 + fx * 2, player.y - fx * 7 + fy * 2 + bob);
  ctx.stroke();
  // Sneak indicator: a small "shh" ring while sneaking.
  if (player.sneaking) {
    ctx.strokeStyle = 'rgba(232, 228, 216, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y + bob, 18 + Math.sin(time * 5) * 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Sapphire-cracking progress ring.
  if (player.channelProgress > 0 && player.channelProgress < 1) {
    ctx.strokeStyle = COLORS.sapphire;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y + bob, 20, -Math.PI / 2, -Math.PI / 2 + player.channelProgress * Math.PI * 2);
    ctx.stroke();
  }
}

// The whole scene, in draw order: floor, cones under cover, cover, loot, exit, actors.
export function drawScene(ctx, state) {
  ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
  ctx.fillStyle = '#0b0d12';
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  drawFloor(ctx);
  drawCameras(ctx, state.cameras);
  drawGuards(ctx, state.guards);
  drawCover(ctx);
  drawLoot(ctx, state.loot, state.time);
  drawExit(ctx, state.loot.sapphire, state.time);
  drawPlayer(ctx, state.player, state.time);
}
