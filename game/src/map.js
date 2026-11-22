// Sapphire Heist v2 — the Meridian Museum job: the building.
// Four rooms around one job: lobby (in), gallery (side loot), security room
// (keycard + camera terminal), vault (the Star Sapphire). The vault door only
// opens once the keycard is lifted from the security desk, and the sapphire
// case only opens after the crack minigame. Every patrol route is a ping-pong
// line whose straight legs never cross a wall except through a door gap.
export const MAP = {
  // Floor zones, each with its own tile look (render.js picks by room id).
  rooms: [
    { id: 'lobby', x: 16, y: 16, w: 224, h: 568 },
    { id: 'gallery', x: 240, y: 16, w: 320, h: 284 },
    { id: 'security', x: 240, y: 300, w: 320, h: 284 },
    { id: 'vault', x: 560, y: 16, w: 384, h: 568 },
  ],

  // Solid rectangles. Outer border + interior walls with door gaps.
  walls: [
    // Outer border.
    { x: 0, y: 0, w: 960, h: 16 },
    { x: 0, y: 584, w: 960, h: 16 },
    { x: 0, y: 0, w: 16, h: 600 },
    { x: 944, y: 0, w: 16, h: 600 },
    // Lobby | gallery+security wall (x = 240), gaps y 110-190 and y 410-490.
    { x: 234, y: 16, w: 12, h: 94 },
    { x: 234, y: 190, w: 12, h: 110 },
    { x: 234, y: 300, w: 12, h: 110 },
    { x: 234, y: 490, w: 12, h: 94 },
    // Gallery | security wall (y = 300), gap x 360-420.
    { x: 240, y: 294, w: 120, h: 12 },
    { x: 420, y: 294, w: 140, h: 12 },
    // Gallery+security | vault wall (x = 560), gaps y 110-190 and y 410-490.
    { x: 554, y: 16, w: 12, h: 94 },
    { x: 554, y: 190, w: 12, h: 110 },
    { x: 554, y: 300, w: 12, h: 110 },
    { x: 554, y: 490, w: 12, h: 94 },
  ],

  // Door gaps in the walls. The vault door is locked until the keycard is held.
  doors: [
    { id: 'galleryDoor', x: 234, y: 110, w: 12, h: 80, locked: false },
    { id: 'securityDoor', x: 234, y: 410, w: 12, h: 80, locked: false },
    { id: 'midDoor', x: 360, y: 294, w: 60, h: 12, locked: false },
    { id: 'vaultDoor', x: 554, y: 110, w: 12, h: 80, locked: true, needs: 'keycard' },
    { id: 'vaultLowerDoor', x: 554, y: 410, w: 12, h: 80, locked: false },
  ],

  // Cover that blocks movement and line of sight.
  obstacles: [
    // Lobby.
    { x: 48, y: 96, w: 110, h: 36, kind: 'desk' },
    { x: 48, y: 220, w: 90, h: 34, kind: 'sofa' },
    { x: 190, y: 90, w: 26, h: 26, kind: 'planter' },
    { x: 140, y: 520, w: 26, h: 26, kind: 'planter' },
    // Gallery.
    { x: 310, y: 60, w: 40, h: 40, kind: 'pedestal' },
    { x: 440, y: 60, w: 40, h: 40, kind: 'pedestal' },
    { x: 360, y: 180, w: 90, h: 28, kind: 'bench' },
    { x: 500, y: 260, w: 30, h: 30, kind: 'statue' },
    // Security.
    { x: 300, y: 360, w: 120, h: 40, kind: 'desk' },
    { x: 300, y: 480, w: 100, h: 36, kind: 'desk' },
    { x: 470, y: 340, w: 40, h: 90, kind: 'rack' },
    // Vault.
    { x: 640, y: 120, w: 28, h: 28, kind: 'pillar' },
    { x: 640, y: 460, w: 28, h: 28, kind: 'pillar' },
    { x: 860, y: 460, w: 28, h: 28, kind: 'pillar' },
    { x: 700, y: 80, w: 60, h: 30, kind: 'pallet' },
    { x: 700, y: 480, w: 60, h: 30, kind: 'pallet' },
  ],

  // The sapphire's glass case (interactable, crack minigame) on the vault wall.
  sapphireCase: { x: 856, y: 40, w: 60, h: 36 },

  // Security terminal: hold E to knock the cameras offline for a while.
  terminal: { x: 340, y: 352 },

  // Keycard on the security desk — unlocks the vault door.
  keycard: { x: 350, y: 530 },

  // Front-door escape zone (bottom of the lobby). Win here with the sapphire.
  exit: { x: 44, y: 556, w: 72, h: 28 },

  // Side loot: kind, position, points. Placed just off furniture so the
  // player can stand next to each one.
  loot: [
    { id: 'painting1', kind: 'painting', x: 320, y: 48, points: 500 },
    { id: 'painting2', kind: 'painting', x: 500, y: 48, points: 500 },
    { id: 'gold1', kind: 'gold', x: 730, y: 130, points: 300 },
    { id: 'gold2', kind: 'gold', x: 730, y: 455, points: 300 },
    { id: 'gold3', kind: 'gold', x: 530, y: 400, points: 300 },
    { id: 'cash1', kind: 'cash', x: 100, y: 140, points: 200 },
    { id: 'cash2', kind: 'cash', x: 460, y: 130, points: 200 },
    { id: 'docs1', kind: 'docs', x: 430, y: 380, points: 400 },
  ],

  // Guards: name, patrol waypoints (ping-pong), and a start waypoint index.
  guards: [
    {
      name: 'Vic', color: '#7fa6d8',
      waypoints: [[120, 320], [120, 120], [300, 150], [300, 280]],
    },
    {
      name: 'Mara', color: '#d88a7f',
      waypoints: [[280, 240], [520, 240], [520, 130], [280, 130]],
    },
    {
      name: 'Odo', color: '#8fd07a',
      waypoints: [[280, 540], [520, 540], [520, 340], [280, 340]],
    },
    {
      name: 'Rex', color: '#c9a2e8',
      waypoints: [[620, 300], [900, 300], [900, 120], [620, 120]],
    },
  ],

  // Cameras: wall mount, base angle (radians, 0 = east), sweep amplitude.
  cameras: [
    { id: 'camLobby', x: 120, y: 18, base: Math.PI / 2, sweep: 0.8 },
    { id: 'camGallery', x: 400, y: 18, base: Math.PI / 2, sweep: 0.85 },
    { id: 'camVault', x: 760, y: 18, base: Math.PI / 2, sweep: 0.7 },
  ],

  spawn: { x: 200, y: 540 },
};
