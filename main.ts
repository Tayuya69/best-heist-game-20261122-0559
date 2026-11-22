// NIGHT VAULT — The Aurum Bank Job: the make.fun entrypoint (Node,
// standard library only). The game is this directory's game/ folder: plain
// static files a desktop browser loads offline (game/index.html and its ES
// modules, no library, no network request). Running this file hands the game
// in: it copies game/ and screenshots/ from beside this file to /output and
// writes /output/dossier.json, the summary the judge reads, using the vendored
// make.fun library. Before writing anything it checks the hand-in against the
// scorer's own caps, so a bad entry fails here loudly instead of scoring
// zero on the server.
//
// Play it locally with any static server, e.g.:
//   cd game && python3 -m http.server 8123   # open http://localhost:8123
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

export const ENTRY_TITLE = 'NIGHT VAULT — The Aurum Bank Job';

// The scorer's caps (reference/gate.json): only text_max_bytes shapes the
// dossier bytes; the rest refuse an entry the scorer would refuse anyway —
// more than 4 screenshots or one over 256 KiB, more than 993 files in game/
// or 48 MiB of game files in all, or a path under game/ over 1000 bytes.
const DOSSIER_OPTIONS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function walkGame(dir, out = { files: 0, bytes: 0 }) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walkGame(path, out);
    else if (entry.isFile()) {
      out.files += 1;
      out.bytes += statSync(path).size;
    }
  }
  return out;
}

// 3 or 4 screenshots, each a PNG or JPEG under the cap; the first by name
// is the cover the judge sees first.
function checkShots(dir) {
  if (!existsSync(dir)) throw new Error(`screenshots/ is missing beside main.ts: ${dir}`);
  const shots = readdirSync(dir).filter((n) => !n.startsWith('.')).sort();
  if (shots.length < 3 || shots.length > DOSSIER_OPTIONS.screenshots.max) {
    throw new Error(`need 3 or 4 screenshots, found ${shots.length}: ${shots.join(', ')}`);
  }
  for (const name of shots) {
    const path = join(dir, name);
    const stats = statSync(path);
    if (!stats.isFile()) throw new Error(`screenshot is not a file: ${name}`);
    if (!/\.(png|jpe?g)$/i.test(name)) throw new Error(`screenshot must be PNG or JPEG: ${name}`);
    if (stats.size > DOSSIER_OPTIONS.screenshots.max_bytes) {
      throw new Error(`screenshot over 256 KiB: ${name} (${stats.size} bytes)`);
    }
  }
  return shots;
}

function main() {
  const here = fileURLToPath(new URL('.', import.meta.url));
  const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

  const shots = checkShots(join(here, 'screenshots'));
  const game = walkGame(join(here, 'game'));

  mkdirSync(out, { recursive: true });
  cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

  const dossier = buildDossier(out, DOSSIER_OPTIONS);
  writeFileSync(join(out, 'dossier.json'), dossier);

  console.log(
    `${ENTRY_TITLE}: game/ ${game.files} files, ${game.bytes} bytes; ` +
    `screenshots ${shots.length} (${shots[0]} is the cover); ` +
    `dossier.json ${dossier.length} bytes -> ${out}`,
  );
}

main();
