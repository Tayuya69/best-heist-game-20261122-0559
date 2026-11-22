// MIDNIGHT EXPRESS — The Gold Train Job: the make.fun entrypoint.
// Node, standard library only. The game itself is the static files in
// game/ beside this file (index.html plus its modules, no library, no
// network request). Running this file hands the game in: it checks the
// hand-in against the scorer's caps, copies game/ and screenshots/ into
// the output directory, and writes dossier.json there with the vendored
// make.fun library — the summary the judge reads. A bad entry fails here
// loudly instead of scoring zero on the server.
//
// Play it locally with any static server, e.g.:
//   cd game && python3 -m http.server 8123   # open http://localhost:8123
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

export const ENTRY_TITLE = 'MIDNIGHT EXPRESS — The Gold Train Job';

// The scorer's caps (reference/gate.json): only text_max_bytes shapes the
// dossier bytes; the rest refuse an entry the scorer would refuse anyway —
// more than 4 screenshots or one over 256 KiB, more than 993 files in
// game/ or 48 MiB of game files in all, or a path under game/ over
// 1000 bytes.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function countTree(dir, tally = { files: 0, bytes: 0 }) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) countTree(p, tally);
    else if (ent.isFile()) {
      tally.files += 1;
      tally.bytes += statSync(p).size;
    }
  }
  return tally;
}

// 3 or 4 screenshots, each a PNG or JPEG under the cap; the first by
// name is the cover the judge sees first.
function listShots(dir) {
  if (!existsSync(dir)) throw new Error(`screenshots/ is missing beside main.ts: ${dir}`);
  const names = readdirSync(dir).filter((n) => !n.startsWith('.')).sort();
  if (names.length < 3 || names.length > CAPS.screenshots.max) {
    throw new Error(`need 3 or 4 screenshots, found ${names.length}: ${names.join(', ')}`);
  }
  for (const name of names) {
    const p = join(dir, name);
    const st = statSync(p);
    if (!st.isFile()) throw new Error(`screenshot is not a file: ${name}`);
    if (!/\.(png|jpe?g)$/i.test(name)) throw new Error(`screenshot must be PNG or JPEG: ${name}`);
    if (st.size > CAPS.screenshots.max_bytes) {
      throw new Error(`screenshot over 256 KiB: ${name} (${st.size} bytes)`);
    }
  }
  return names;
}

function run() {
  const here = fileURLToPath(new URL('.', import.meta.url));
  const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

  const shots = listShots(join(here, 'screenshots'));
  const game = countTree(join(here, 'game'));

  mkdirSync(out, { recursive: true });
  cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

  const dossier = buildDossier(out, CAPS);
  writeFileSync(join(out, 'dossier.json'), dossier);

  console.log(
    `${ENTRY_TITLE}: game/ ${game.files} files, ${game.bytes} bytes; ` +
    `screenshots ${shots.length} (${shots[0]} is the cover); ` +
    `dossier.json ${dossier.length} bytes -> ${out}`,
  );
}

run();
