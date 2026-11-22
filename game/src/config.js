// Sapphire Heist v2 — tuning constants. Every number the game uses lives here
// so the feel can be retuned without touching the systems.
export const CFG = {
  // Canvas / world (logical pixels; the page scales the canvas with CSS).
  W: 960,
  H: 600,

  // Player.
  playerRadius: 13,
  walkSpeed: 118,      // px per second
  sneakSpeed: 58,      // px per second while Shift is held
  sneakDetectMul: 0.58, // detection range multiplier while sneaking
  sneakGainMul: 0.55,   // suspicion gain multiplier while sneaking
  hearts: 3,
  catchInvuln: 2.0,    // seconds of invulnerability after being caught
  respawn: { x: 60, y: 540 }, // lobby front-door spawn

  // Timer.
  timeLimit: 300, // 5:00

  // Guards.
  guardRadius: 14,
  guardPatrolSpeed: 62,
  guardChaseSpeed: 128,
  guardVisionRange: 165,
  guardVisionHalfAngle: 0.61, // ~35 degrees
  suspicionPerSec: 55,   // suspicion gained while the player is inside a lit cone
  suspicionDecay: 26,    // per second while unseen
  chaseMemory: 3.2,      // seconds a guard keeps hunting after losing sight
  catchRadius: 22,       // touch distance that costs a heart

  // Cameras.
  cameraRange: 185,
  cameraHalfAngle: 0.36, // ~21 degrees
  cameraSweepSpeed: 0.55, // radians per second of sweep
  cameraLockPerSec: 34,  // alarm gained per second while a camera locks on
  cameraHackSecs: 2.5,   // channel time at the security terminal
  cameraOfflineSecs: 40, // how long cameras stay dark after a hack
  cameraCooldownSecs: 20,

  // Alarm.
  alarmSeenPerSec: 16,   // alarm gained while any guard has eyes on the player
  alarmDecayPerSec: 3.5, // alarm bled off while nobody sees the player
  alarmCaughtJump: 25,   // alarm jump when a guard catches the player
  alarmCrackFail: 10,    // alarm jump when a crack timing hit misses

  // Vault crack minigame.
  crackHitsNeeded: 3,
  crackNeedleBase: 2.4,  // radians per second, grows after each hit
  crackNeedleStep: 0.7,
  crackGreenHalf: 0.34,  // half-width of the green zone on the timing bar

  // Score.
  scoreSapphire: 1000,
  scorePainting: 500,
  scoreGold: 300,
  scoreCash: 200,
  scoreDocs: 400,
  scoreTimePerSec: 10,   // bonus per second left on the clock at escape
  scoreGhost: 500,       // bonus for escaping without ever being spotted

  // Interaction.
  interactRadius: 46,
  pickupRadius: 30,
};
