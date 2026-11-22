// MIDNIGHT VAULT — The Star Sapphire Job: the make.fun entrypoint (Node 22,
// standard library only). The game is this directory's game/ folder: plain
// static files a desktop browser loads offline (game/index.html and its ES
// modules, no library, no network request). This program hands the game in:
// it copies game/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored make.fun
// library. Before writing the dossier it refuses a bad hand-in the scorer
// would refuse anyway (wrong screenshot count, an oversize screenshot), so a
// broken entry fails here, loudly, instead of silently scoring zero.
//
// Serve the game locally with any static server, e.g.:
//   cd game && python3 -m http.server 8123   # open http://localhost:8123
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The entry's public name, kept in one place so the dossier and the logs agree.
export const ENTRY_TITLE = 'MIDNIGHT VAULT — The Star Sapphire Job';

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of
// game files, in all, or a path under game/ over 1000 bytes: game/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
const DOSSIER_OPTIONS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function countGameFiles(dir) {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = countGameFiles(path);
      files += sub.files;
      bytes += sub.bytes;
    } else if (entry.isFile()) {
      files += 1;
      bytes += statSync(path).size;
    }
  }
  return { files, bytes };
}

// Refuse a hand-in the scorer would refuse: 3 or 4 screenshots, each a PNG or
// JPEG under the cap, first by name the cover. Loud failure beats a silent 0.
function checkScreenshots(dir) {
  if (!existsSync(dir)) throw new Error(`screenshots/ is missing beside main.ts: ${dir}`);
  const shots = readdirSync(dir)
    .filter((name) => !name.startsWith('.'))
    .sort();
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

  const shots = checkScreenshots(join(here, 'screenshots'));
  const game = countGameFiles(join(here, 'game'));

  mkdirSync(out, { recursive: true });
  cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

  const dossier = buildDossier(out, DOSSIER_OPTIONS);
  writeFileSync(join(out, 'dossier.json'), dossier);

  // A one-line receipt for the build log: what went in and what came out.
  console.log(
    `${ENTRY_TITLE}: game/ ${game.files} files, ${game.bytes} bytes; ` +
      `screenshots ${shots.length} (${shots[0]} is the cover); ` +
      `dossier.json ${dossier.length} bytes -> ${out}`,
  );
}

main();
