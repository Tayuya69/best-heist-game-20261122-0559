# NEON VAULT — The Golden Chip Job

A top-down stealth heist game for the make.fun "Make the best heist game"
bounty. Rob the Golden Chip casino before 6:00: slip in from the parking
garage, lift the VIP keycard from the lounge, kill the cage alarm at the
cashier, crack the vault's chip-sequence lock, grab the $1,000 jackpot and
vanish into the garage.

## How it plays

- **Move** WASD / arrows (or click to walk there), **Shift** sneaks,
  **E** interacts, **Q** smoke bomb (×2), **F** EMP (×1), **P** pauses,
  **M** mutes, **R** retries.
- Five guards patrol the floor with vision cones; four cameras sweep beams
  that track you and call the nearest guard. Slot machines, card tables,
  the roulette wheel, couches and parked cars all block sight, so you read
  the cones and pick a route.
- The alarm meter climbs while a guard hunts or a camera holds you, and
  bleeds off while you stay hidden. At 100 the casino locks down.
- The vault lock is a memory game: watch the neon chips flash, then repeat
  the sequence (keys 1–4 or click). Three rounds, each one chip longer.
  A wrong chip costs alarm.
- Score is loot plus a time bonus plus a $500 ghost bonus for staying
  under 25 alarm all run.

## Files

- `game/index.html` — the page (960×600 canvas, shot mode for screenshots)
- `game/src/config.js` — tuning and the neon-casino palette
- `game/src/level.js` — the casino floor, walls, doors, cover, loot, routes
- `game/src/guards.js` — guard patrol/sight/chase and camera sweep/track/lock
- `game/src/player.js` — movement, collision, sneak, smoke and EMP
- `game/src/vault.js` — the chip-sequence lock (pure logic)
- `game/src/game.js` — the state machine, objectives, alarm, win/lose
- `game/src/render.js` — canvas drawing of the casino
- `game/src/hud.js` — HUD (alarm meter, objective, loot, clock) and screens
- `game/src/audio.js` — synthesized WebAudio sound, no audio files
- `game/src/main.js` — bootstrap, input, animation loop
- `main.ts` — the make.fun entrypoint: copies game/ and screenshots/ to
  /output and writes dossier.json

Play it locally: `cd game && python3 -m http.server 8123`, then open
http://localhost:8123 in a desktop browser. No build step, no network.
