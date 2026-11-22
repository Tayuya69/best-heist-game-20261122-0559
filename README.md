[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/?ref=fmy43x6e&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Tayuya69/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Tayuya69/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

# MIDNIGHT EXPRESS — The Gold Train Job

A side-view stealth heist game for the [make.fun "Make the best heist game" bounty](https://make.fun/bounty/best-heist-game-20261122-0559). A luxury train is carrying gold bullion to the city. You board in the baggage car, slip through the dining car, the sleeper car and the vault car, lift gold bars, dodge patrolling guards and sweeping security cameras, and reach the locomotive with at least 10 gold before the train arrives.

## How it plays

- **Move** ← → / A D, **Space / W** jumps, **S** crouches, **Shift** sneaks, **P** pauses, **M** mutes, **R** retries, **Enter** boards.
- Five guards patrol the cars with visible vision cones; step into a cone and their alert climbs, at full alert they chase you. Crates block their sight — hide behind one.
- Five ceiling cameras sweep a beam across the floor; standing in a beam fills the ALARM meter. At 100 the alarm sounds, every guard charges and you lose a life. Crouching or sneaking halves the fill rate.
- 24 gold bars are scattered through the train, some on crates, some in the air. The locomotive door needs 10 to open. Three lives, 150 seconds to the terminus.
- Score is gold plus a time bonus plus a 500 ghost bonus for finishing without losing a life.

## Files

- `game/index.html` — the page (960×600 canvas, shot mode for screenshots)
- `game/src/level.js` — the train: cars, crates, luggage, gold, guards, cameras
- `game/src/main.js` — the whole game: state, physics, guards, cameras, alarm, rendering, HUD, screens, sound
- `main.ts` — the entrypoint: checks the hand-in, copies game/ and screenshots/ to the output, writes dossier.json
