// Sapphire Heist v2 — screenshot scene presets. Each one stages a real game
// state (real actors, real HUD, real alarm) so the renders are the game's own
// code playing, never a mock-up. The driver waits for window.__shotReady,
// which main.js raises a few frames after a scene is applied.
import { MAP } from './map.js';

function placeGuard(game, name, x, y, facing, suspicion = 0) {
  const g = game.guards.find((gg) => gg.name === name);
  if (!g) return;
  g.x = x;
  g.y = y;
  g.facing = facing;
  g.suspicion = suspicion;
  g.state = 'patrol';
  g.lastSeen = null;
  g.memory = 0;
}

function placeCamera(game, id, phase) {
  const c = game.cameras.find((cc) => cc.id === id);
  if (c) c.phase = phase;
}

export function applyScene(game, scene) {
  game.phase = 'playing';
  game.time = 5;
  if (scene === 'title') {
    game.phase = 'title';
    return;
  }

  if (scene === 'cover') {
    // The money frame: gallery, thief mid-room, two guard cones on him, a
    // camera beam sweeping, loot on the walls and the alarm meter up.
    game.player.x = 350;
    game.player.y = 210;
    game.player.facing = 0.4;
    game.player.hasKeycard = true;
    game.keycardTaken = true;
    game.score = 700;
    game.alarm = 35;
    game.timeLeft = 210;
    placeGuard(game, 'Vic', 200, 150, 0.38, 55);
    game.guards.find((g) => g.name === 'Vic').wp = 2;
    placeGuard(game, 'Mara', 430, 180, 2.78, 20);
    game.guards.find((g) => g.name === 'Mara').wp = 0;
    placeCamera(game, 'camGallery', 0.6);
    placeCamera(game, 'camLobby', -0.4);
    return;
  }

  if (scene === 'spotted') {
    // Alarm high, Rex hunting the thief inside the vault, camera locked on.
    game.player.x = 720;
    game.player.y = 180;
    game.player.facing = -2.4;
    game.player.hasKeycard = true;
    game.keycardTaken = true;
    game.vaultOpen = true;
    game.score = 1200;
    game.alarm = 60;
    game.timeLeft = 150;
    game.player.hearts = 3;
    game.player.invuln = 0;
    game.staging = true; // freeze Rex mid-chase for the render
    game.shake = 4;
    const rex = game.guards.find((g) => g.name === 'Rex');
    rex.x = 655;
    rex.y = 195;
    rex.facing = 0.2;
    rex.suspicion = 100;
    rex.state = 'chase';
    rex.lastSeen = { x: 720, y: 180 };
    rex.memory = 3.2;
    placeGuard(game, 'Odo', 480, 420, 0.5, 70);
    placeCamera(game, 'camVault', 0.35);
    return;
  }

  if (scene === 'win') {
    // Victory screen over the escape: sapphire in hand at the front door.
    game.player.x = 80;
    game.player.y = 570;
    game.player.hasSapphire = true;
    game.caseOpen = true;
    game.vaultOpen = true;
    game.player.hasKeycard = true;
    game.keycardTaken = true;
    game.score = 2400;
    game.timeLeft = 132;
    game.alarm = 12;
    game.phase = 'win';
    game.finalScore = 4220;
    game.finalBreakdown = [
      ['Loot', 2400],
      ['Time bonus', 1320],
      ['Ghost bonus', 500],
    ];
    return;
  }

  // Unknown scene: just play from the title.
  game.phase = 'title';
}
