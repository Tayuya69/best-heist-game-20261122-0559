// Sapphire Heist v2 — canvas drawing: four distinct rooms, cover, cones,
// cameras, loot, actors, particles and the night vignette. Danger reads at a
// glance: amber cones are guards, red beams are cameras, the sapphire glows
// cyan, the exit glows green.
import { CFG } from './config.js';
import { MAP } from './map.js';
import { dist } from './geo.js';

const PAL = {
  lobbyA: '#2b2118', lobbyB: '#251d14',
  galleryA: '#232833', galleryB: '#1e232e',
  securityA: '#1c222c', securityB: '#18202a',
  vaultA: '#1e2b22', vaultB: '#1a241d',
  wall: '#454b5c', wallTop: '#5a6276',
  desk: '#4a3421', sofa: '#5d1f26', planter: '#2f5d33',
  pedestal: '#565d6e', bench: '#3a3f4d', statue: '#6e7688',
  rack: '#232a38', pillar: '#565d6e', pallet: '#6b4e2a',
  gold: '#f2c14e', cash: '#5da864', docs: '#e8e4d8',
  sapphire: '#4fd2ff', exit: '#1f9d55', exitGlow: '#35d07f',
  thief: '#14151b', thiefTrim: '#e8b23a',
  cone: 'rgba(242, 193, 78, 0.20)', coneEdge: 'rgba(242, 193, 78, 0.55)',
  coneHot: 'rgba(224, 82, 82, 0.28)', coneHotEdge: 'rgba(224, 82, 82, 0.7)',
  beam: 'rgba(224, 82, 82, 0.15)', beamEdge: 'rgba(224, 82, 82, 0.5)',
  beamHot: 'rgba(224, 82, 82, 0.32)',
  text: '#e8e4d8', textDim: '#8a91a3',
};

function drawCone(ctx, ox, oy, heading, halfAngle, range, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.arc(ox, oy, range, heading - halfAngle, heading + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx, time) {
  const tile = 40;
  const looks = {
    lobby: [PAL.lobbyA, PAL.lobbyB],
    gallery: [PAL.galleryA, PAL.galleryB],
    security: [PAL.securityA, PAL.securityB],
    vault: [PAL.vaultA, PAL.vaultB],
  };
  for (const room of MAP.rooms) {
    const [a, b] = looks[room.id];
    for (let y = room.y; y < room.y + room.h; y += tile) {
      for (let x = room.x; x < room.x + room.w; x += tile) {
        const even = (Math.floor((x - room.x) / tile) + Math.floor((y - room.y) / tile)) % 2 === 0;
        ctx.fillStyle = even ? a : b;
        ctx.fillRect(x, y, Math.min(tile, room.x + room.w - x), Math.min(tile, room.y + room.h - y));
      }
    }
    ctx.fillStyle = 'rgba(232, 228, 216, 0.10)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(room.id.toUpperCase(), room.x + 10, room.y + 20);
  }
  // Lobby rug.
  ctx.fillStyle = 'rgba(93, 31, 38, 0.55)';
  ctx.fillRect(40, 300, 150, 110);
  ctx.strokeStyle = 'rgba(138, 109, 47, 0.6)';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 300, 150, 110);
}

function drawWalls(ctx) {
  for (const w of MAP.walls) {
    ctx.fillStyle = PAL.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PAL.wallTop;
    if (w.h <= 16) ctx.fillRect(w.x, w.y, w.w, 3);
    else ctx.fillRect(w.x, w.y, 3, w.h);
  }
}

function drawDoors(ctx, game) {
  for (const d of MAP.doors) {
    if (d.id === 'vaultDoor' && !game.vaultOpen) {
      ctx.fillStyle = '#7a2a2a';
      ctx.fillRect(d.x - 2, d.y - 2, d.w + 4, d.h + 4);
      ctx.fillStyle = '#e05252';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(d.x + d.w / 2, d.y + d.h / 2);
      ctx.rotate(Math.PI / 2);
      ctx.fillText('LOCKED', 0, 3);
      ctx.restore();
    } else {
      ctx.fillStyle = d.id === 'vaultDoor' ? 'rgba(53, 208, 127, 0.5)' : 'rgba(138, 109, 47, 0.45)';
      ctx.fillRect(d.x, d.y, d.w, d.h);
    }
  }
}

function drawObstacles(ctx, time) {
  for (const o of MAP.obstacles) {
    switch (o.kind) {
      case 'desk':
        ctx.fillStyle = PAL.desk;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = 'rgba(90, 180, 255, 0.5)';
        ctx.fillRect(o.x + 10, o.y + 6, 18, 12);
        ctx.fillRect(o.x + o.w - 30, o.y + 6, 18, 12);
        break;
      case 'sofa':
        ctx.fillStyle = PAL.sofa;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(o.x + 6, o.y + 6, o.w - 12, 8);
        break;
      case 'planter':
        ctx.fillStyle = '#5a4632';
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = PAL.planter;
        ctx.beginPath();
        ctx.arc(o.x + o.w / 2, o.y + o.h / 2, 11, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'pedestal':
        ctx.fillStyle = PAL.pedestal;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = PAL.gold;
        ctx.fillRect(o.x + 6, o.y + 6, o.w - 12, 4);
        break;
      case 'bench':
        ctx.fillStyle = PAL.bench;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        break;
      case 'statue':
        ctx.fillStyle = PAL.statue;
        ctx.beginPath();
        ctx.arc(o.x + o.w / 2, o.y + o.h / 2, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(o.x + o.w / 2 - 4, o.y + o.h / 2 - 18, 8, 12);
        break;
      case 'rack': {
        ctx.fillStyle = PAL.rack;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        const blink = Math.sin(time * 4 + o.x) > 0;
        ctx.fillStyle = blink ? '#35d07f' : '#e05252';
        for (let i = 0; i < 4; i += 1) ctx.fillRect(o.x + 6, o.y + 8 + i * 20, 6, 6);
        break;
      }
      case 'pillar':
        ctx.fillStyle = PAL.pillar;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.fillRect(o.x, o.y, 5, o.h);
        break;
      case 'pallet':
        ctx.fillStyle = PAL.pallet;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = PAL.gold;
        ctx.fillRect(o.x + 8, o.y + 8, 14, 8);
        ctx.fillRect(o.x + 30, o.y + 8, 14, 8);
        break;
      default:
        break;
    }
  }
}

function drawLoot(ctx, game, time) {
  for (const l of game.loot) {
    if (l.taken) continue;
    const bob = Math.sin(time * 3 + l.x) * 2;
    const glow = 0.5 + 0.3 * Math.sin(time * 3 + l.x);
    ctx.save();
    ctx.globalAlpha = glow;
    ctx.fillStyle = PAL.gold;
    ctx.beginPath();
    ctx.arc(l.x, l.y + bob, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (l.kind === 'painting') {
      ctx.fillStyle = '#8a6d2f';
      ctx.fillRect(l.x - 16, l.y - 10 + bob, 32, 20);
      ctx.fillStyle = '#3f6d8e';
      ctx.fillRect(l.x - 13, l.y - 7 + bob, 26, 14);
      ctx.fillStyle = '#e8b23a';
      ctx.beginPath();
      ctx.arc(l.x + 6, l.y - 2 + bob, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (l.kind === 'gold') {
      ctx.fillStyle = PAL.gold;
      ctx.fillRect(l.x - 10, l.y - 5 + bob, 20, 10);
      ctx.fillStyle = '#fff0b0';
      ctx.fillRect(l.x - 10, l.y - 5 + bob, 20, 3);
    } else if (l.kind === 'cash') {
      ctx.fillStyle = PAL.cash;
      ctx.fillRect(l.x - 11, l.y - 7 + bob, 22, 14);
      ctx.fillStyle = '#d8f0d8';
      ctx.fillRect(l.x - 4, l.y - 3 + bob, 8, 6);
    } else if (l.kind === 'docs') {
      ctx.fillStyle = PAL.docs;
      ctx.fillRect(l.x - 9, l.y - 11 + bob, 18, 22);
      ctx.strokeStyle = '#8a91a3';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(l.x - 6, l.y - 6 + i * 5 + bob);
        ctx.lineTo(l.x + 6, l.y - 6 + i * 5 + bob);
        ctx.stroke();
      }
    }
  }

  // Keycard on the security desk.
  if (!game.keycardTaken) {
    const k = MAP.keycard;
    const bob = Math.sin(time * 3) * 2;
    ctx.fillStyle = 'rgba(53, 208, 127, 0.5)';
    ctx.beginPath();
    ctx.arc(k.x, k.y + bob, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#35d07f';
    ctx.fillRect(k.x - 11, k.y - 7 + bob, 22, 14);
    ctx.fillStyle = '#0b0d12';
    ctx.fillRect(k.x - 7, k.y - 4 + bob, 6, 8);
  }

  // The sapphire case on the vault wall.
  const c = MAP.sapphireCase;
  ctx.fillStyle = '#2e3442';
  ctx.fillRect(c.x - 4, c.y - 4, c.w + 8, c.h + 8);
  ctx.fillStyle = game.caseOpen ? 'rgba(140,190,220,0.08)' : 'rgba(140, 190, 220, 0.22)';
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.strokeStyle = '#8a6d2f';
  ctx.lineWidth = 2;
  ctx.strokeRect(c.x, c.y, c.w, c.h);
  if (!game.caseOpen) {
    const pulse = 0.7 + 0.3 * Math.sin(time * 4);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = PAL.sapphire;
    ctx.beginPath();
    ctx.moveTo(c.x + 30, c.y + 6);
    ctx.lineTo(c.x + 44, c.y + 18);
    ctx.lineTo(c.x + 30, c.y + 30);
    ctx.lineTo(c.x + 16, c.y + 18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Security terminal.
  const t = MAP.terminal;
  const off = game.time < game.camerasOfflineUntil;
  ctx.fillStyle = '#232a38';
  ctx.fillRect(t.x - 16, t.y - 10, 32, 20);
  ctx.fillStyle = off ? '#8a91a3' : '#35d07f';
  ctx.fillRect(t.x - 11, t.y - 6, 22, 12);
  ctx.fillStyle = '#0b0d12';
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(off ? 'OFF' : 'CAM', t.x, t.y + 3);
}

function drawExit(ctx, game, time) {
  const e = MAP.exit;
  const pulse = 0.55 + 0.35 * Math.sin(time * 4);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = PAL.exitGlow;
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.restore();
  ctx.fillStyle = PAL.exit;
  ctx.fillRect(e.x, e.y, e.w, 4);
  ctx.fillStyle = '#e8f5ec';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2 + 4);
}

function drawGuards(ctx, game) {
  for (const g of game.guards) {
    const hot = g.state === 'chase' || g.suspicion > 60;
    drawCone(ctx, g.x, g.y, g.facing, CFG.guardVisionHalfAngle, CFG.guardVisionRange,
      hot ? PAL.coneHot : PAL.cone, hot ? PAL.coneHotEdge : PAL.coneEdge);
  }
  for (const g of game.guards) {
    const hot = g.state === 'chase';
    // Body.
    ctx.fillStyle = '#31435c';
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = g.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // Facing wedge.
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.moveTo(g.x + Math.cos(g.facing) * (g.radius + 7), g.y + Math.sin(g.facing) * (g.radius + 7));
    ctx.lineTo(g.x + Math.cos(g.facing + 2.6) * g.radius * 0.7, g.y + Math.sin(g.facing + 2.6) * g.radius * 0.7);
    ctx.lineTo(g.x + Math.cos(g.facing - 2.6) * g.radius * 0.7, g.y + Math.sin(g.facing - 2.6) * g.radius * 0.7);
    ctx.closePath();
    ctx.fill();
    // Suspicion arc over the head.
    if (g.suspicion > 2) {
      ctx.strokeStyle = g.suspicion > 60 ? '#e05252' : '#f2c14e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius + 8, -Math.PI / 2, -Math.PI / 2 + (g.suspicion / 100) * Math.PI * 2);
      ctx.stroke();
    }
    if (hot) {
      ctx.fillStyle = '#e05252';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - g.radius - 12);
    }
    ctx.fillStyle = PAL.textDim;
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.name, g.x, g.y + g.radius + 12);
  }
}

function drawCameras(ctx, game) {
  const off = game.time < game.camerasOfflineUntil;
  for (const c of game.cameras) {
    if (!off) {
      drawCone(ctx, c.x, c.y, c.angle, CFG.cameraHalfAngle, CFG.cameraRange,
        c.locking ? PAL.beamHot : PAL.beam, c.locking ? PAL.beamHot : PAL.beamEdge);
    }
    ctx.fillStyle = off ? '#5a6276' : '#3a3f4d';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = off ? '#8a91a3' : (c.locking ? '#e05252' : '#f2c14e');
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = off ? '#8a91a3' : '#e05252';
    ctx.beginPath();
    ctx.arc(c.x + Math.cos(c.angle) * 6, c.y + Math.sin(c.angle) * 6, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(ctx, game, time) {
  const p = game.player;
  if (p.invuln > 0 && Math.floor(time * 12) % 2 === 0) return; // blink while invulnerable
  // Sneak ring.
  if (p.sneaking) {
    ctx.strokeStyle = 'rgba(232, 178, 58, 0.5)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // Gold glow under the thief so the player always reads against dark floors.
  ctx.fillStyle = 'rgba(232, 178, 58, 0.20)';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius + 9, 0, Math.PI * 2);
  ctx.fill();
  // Hooded figure: dark cloak, gold trim, facing point.
  ctx.fillStyle = PAL.thief;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PAL.thiefTrim;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = PAL.thiefTrim;
  ctx.beginPath();
  ctx.moveTo(p.x + Math.cos(p.facing) * (p.radius + 6), p.y + Math.sin(p.facing) * (p.radius + 6));
  ctx.lineTo(p.x + Math.cos(p.facing + 2.7) * p.radius * 0.6, p.y + Math.sin(p.facing + 2.7) * p.radius * 0.6);
  ctx.lineTo(p.x + Math.cos(p.facing - 2.7) * p.radius * 0.6, p.y + Math.sin(p.facing - 2.7) * p.radius * 0.6);
  ctx.closePath();
  ctx.fill();
  if (p.hasSapphire) {
    const pulse = 0.6 + 0.4 * Math.sin(time * 5);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = PAL.sapphire;
    ctx.beginPath();
    ctx.arc(p.x, p.y - p.radius - 8, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Click-to-move marker.
  if (p.clickTarget) {
    ctx.strokeStyle = 'rgba(232, 228, 216, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.clickTarget.x, p.clickTarget.y, 6, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawParticles(ctx, game) {
  for (const pt of game.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.max);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;
}

function drawVignette(ctx) {
  const g = ctx.createRadialGradient(480, 300, 260, 480, 300, 640);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CFG.W, CFG.H);
}

export function drawScene(ctx, game) {
  ctx.clearRect(0, 0, CFG.W, CFG.H);
  ctx.save();
  if (game.shake > 0.3) {
    ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
  }
  drawFloor(ctx, game.time);
  drawExit(ctx, game, game.time);
  drawDoors(ctx, game);
  drawObstacles(ctx, game.time);
  drawLoot(ctx, game, game.time);
  drawCameras(ctx, game);
  drawGuards(ctx, game);
  drawPlayer(ctx, game, game.time);
  drawParticles(ctx, game);
  ctx.restore();
  drawVignette(ctx);
}
