[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/?ref=fmy43x6e&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Tayuya69/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Tayuya69/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

# MIDNIGHT VAULT — The Star Sapphire Job

A top-down heist game, built for the [make.fun "Make the best heist game" competition](https://make.fun/bounty/best-heist-game-20261122-0559). You are a thief in a bank vault hall at night: slip past three patrolling guards and two sweeping cameras, crack the glass case, lift the Star Sapphire, and walk out the green EXIT before the alarm hits 100%.

## How it plays

- **One vault hall, seen from above** — display cases, desks, pillars and a safe wall break line of sight, so every cone has a route around it.
- **Guards with visible vision cones** patrol fixed routes you can learn (Vic, Mara, Odo). Standing in a lit cone fills a guard's suspicion; a full meter means he raises the alarm and hunts your last-seen spot.
- **Cameras sweep their beams** across the wings. Cross a beam only when the lens swings away — a camera lock feeds the alarm fast.
- **An alarm meter with a way back** — it rises while anyone sees you and bleeds off while you hide. At 100% the vault locks down and the job is over.
- **Depth** — three loot targets (the sapphire is the job; two gold bars and the vault ledger are optional score), a crack-channel on the sapphire case, sneak speed vs. detection trade-offs, and a speed bonus on the getaway.
- **Feel and polish** — wall sliding, click-to-move, WebAudio synth footsteps, pickup chimes and alarm stings, title / caught / lockdown / win screens, timer and score.

## Controls

| Input | Action |
|---|---|
| WASD / arrow keys | Move |
| Shift (hold) | Sneak — slower, harder to spot |
| Click | Walk to that point |
| M | Mute |
| P | Pause |
| R | Retry after being caught or winning |
| Enter | Start |

## Play it

Serve `game/` with any static server and open `index.html` in a desktop browser — no build step, no network requests, everything is a file under `game/`:

```sh
cd game && python3 -m http.server 8123
# open http://localhost:8123
```

Screenshot scenes (`?scene=cover`, `?scene=spotted`, `?scene=win`, `?scene=title`) set up real game states for renders.

## Layout

- `game/index.html` — the page: canvas, title, help line.
- `game/src/config.js` — every tuned number in one place.
- `game/src/geometry.js` — lines of sight, cones, circle-vs-rect (pure logic).
- `game/src/level.js` — the vault hall: cover, loot, patrol routes, cameras, exit.
- `game/src/guards.js` — patrols, vision cones, suspicion, hunting.
- `game/src/cameras.js` — sweeping camera beams and locks.
- `game/src/player.js` — movement, wall sliding, sneak, click-to-move.
- `game/src/audio.js` — synthesised footsteps, alarm, pickups (WebAudio, no files).
- `game/src/input.js` — keyboard + mouse state.
- `game/src/render.js` — canvas drawing: floor, cover, cones, loot, actors.
- `game/src/hud.js` — HUD bar, alarm meter, alert banner, title / end screens.
- `game/src/shots.js` — screenshot scene presets.
- `game/src/main.js` — game loop and state machine.
- `main.ts` — the make.fun entrypoint: copies `game/` + `screenshots/` to `/output` and writes `dossier.json`.
- `screenshots/` — four real renders of the game's own code (cover first).

## License

MIT — see [LICENSE](LICENSE).
