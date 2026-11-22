[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/?ref=fmy43x6e&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Tayuya69/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Tayuya69/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

# SAPPHIRE HEIST — The Meridian Museum Job

A top-down stealth heist game, built for the [make.fun "Make the best heist game" competition](https://make.fun/bounty/best-heist-game-20261122-0559). One thief, one museum, one Star Sapphire. Lift the keycard from the security room, unlock the vault, crack the sapphire case in a timing minigame, and walk out the front door — past four patrolling guards and three sweeping cameras — before the alarm hits 100% or the five minutes run out.

## How it plays

- **Four rooms, one job** — lobby, gallery, security room and vault, each with its own floor and cover. Doors connect them; the vault door only opens with the keycard.
- **Guards with visible vision cones** patrol ping-pong routes you can learn (Vic, Mara, Odo, Rex). Standing in a lit cone fills a guard's suspicion arc; a full arc means he raises the alarm and hunts your last-seen spot. Lose him for a few seconds and he walks back.
- **Cameras sweep their beams** across the lobby, gallery and vault. A lock feeds the alarm fast — or hack the security terminal (hold still, 2.5s channel) to knock all cameras dark for 40 seconds.
- **An alarm meter with a way back** — it rises while anyone sees you and bleeds off while you hide. At 100% the museum locks down and the job is over.
- **The crack minigame** — at the sapphire case, stop the needle in the green three times. A miss jumps the alarm. The case pops open and the sapphire is yours.
- **Depth** — eight side-loot targets (paintings, gold, cash, documents), a keycard objective chain, sneak speed vs. detection trade-offs, three lives with a front-door respawn, a 5:00 clock, and a score with time + ghost bonuses.
- **Feel and polish** — wall sliding, click-to-move, WebAudio synth footsteps, pickup chimes, alarm stings and win/lose jingles, title / how-to / pause / caught / lockdown / timeout / win screens, particles on pickups, screen shake on alarms, and a night vignette.

## Controls

| Input | Action |
|---|---|
| WASD / arrow keys | Move |
| Shift (hold) | Sneak — slower, harder to spot |
| E | Interact / crack (stop the needle in the green) |
| Click | Walk to that point |
| Enter | Start |
| P | Pause |
| M | Mute |
| R | Retry after an ending |
| Esc | Cancel the crack |

## Play it

Serve `game/` with any static server and open `index.html` in a desktop browser — no build step, no network requests, everything is a file under `game/`:

```sh
cd game && python3 -m http.server 8123
# open http://localhost:8123
```

Screenshot scenes (`?scene=cover`, `?scene=spotted`, `?scene=win`, `?scene=title`) set up real game states for renders. `?autostart=1` skips the title screen.

## Layout

- `game/index.html` — the page: canvas, title, help line.
- `game/src/config.js` — every tuned number in one place.
- `game/src/map.js` — the museum: rooms, walls, doors, cover, loot, patrols, cameras.
- `game/src/geo.js` — pure geometry: circle-vs-rect movement, line of sight, cones.
- `game/src/entities.js` — the thief, guards (patrol / suspicion / chase / return), cameras.
- `game/src/logic.js` — the rules: alarm, objectives, pickups, crack minigame, camera hack, catches, win/lose.
- `game/src/audio.js` — synthesised WebAudio sounds, no files.
- `game/src/render.js` — canvas drawing: floors, cover, cones, beams, loot, actors, particles.
- `game/src/hud.js` — HUD bar, alarm meter, banners, crack bar, title / end screens.
- `game/src/scenes.js` — screenshot scene presets.
- `game/src/main.js` — game loop, input, phase machine.
- `main.ts` — the make.fun entrypoint: copies `game/` + `screenshots/` to `/output` and writes `dossier.json`.
- `screenshots/` — four real renders of the game's own code (cover first).

## License

MIT — see [LICENSE](LICENSE).
