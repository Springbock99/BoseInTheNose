// Derives app/data/players.json from Sleeper's full player dump.
//
// The upstream payload is ~14 MB of 12k players with 53 fields each, and takes
// several seconds to fetch. Pulling that inside a request would make every cold
// start slow, so it is fetched once at build time and trimmed to the fields the
// UI actually reads.
//
// Refresh with `npm run players`.

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = resolve(root, 'app/data/players.json');
const SOURCE = 'https://api.sleeper.app/v1/players/nfl';

// Matches PlayerMeta in the UI. Keeping upstream field names means the API
// response shape is unchanged from the old Express backend.
const KEEP = ['first_name', 'last_name', 'full_name', 'position', 'team'];

function fail(message) {
  console.error(`\n  build-players failed: ${message}\n`);
  process.exit(1);
}

const response = await fetch(SOURCE, { headers: { accept: 'application/json' } });
if (!response.ok) fail(`Sleeper responded ${response.status}`);

const raw = await response.json();
const ids = Object.keys(raw);
if (ids.length < 1000) fail(`only ${ids.length} players returned — refusing to overwrite`);

const players = {};
for (const [id, player] of Object.entries(raw)) {
  const trimmed = {};
  for (const field of KEEP) {
    if (player[field]) trimmed[field] = player[field];
  }
  // A player with no name is unusable for the directory this feeds.
  if (trimmed.full_name || trimmed.last_name) players[id] = trimmed;
}

const named = Object.keys(players).length;
if (named < 1000) fail(`only ${named} players had names — refusing to overwrite`);

await mkdir(dirname(TARGET), { recursive: true });
await writeFile(TARGET, `${JSON.stringify(players)}\n`);

const rawMb = (JSON.stringify(raw).length / 1024 / 1024).toFixed(1);
const outMb = (JSON.stringify(players).length / 1024 / 1024).toFixed(2);
console.log(`  ${ids.length} players upstream (${rawMb} MB)`);
console.log(`  ${named} kept, trimmed to ${KEEP.length} fields (${outMb} MB)`);
console.log(`  -> app/data/players.json`);
