// Guards app/data/bouseathlon.json, which is hand-edited: a typo there breaks
// the page at build time, not in a test run, so check the shape here.
// Run: npm run test:bouseathlon
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const guide = JSON.parse(
  readFileSync(new URL('../app/data/bouseathlon.json', import.meta.url), 'utf8'),
);

let pass = 0;
let fail = 0;
const check = (name, cond, detail = '') => {
  if (cond) pass += 1;
  else fail += 1;
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}${!cond && detail ? `  -> ${detail}` : ''}`);
};

console.log('\n=== bouseathlon guide ===');
const { events, sections } = guide;
check('10 events', events.length === 10, String(events.length));
check('numbered 1-10 in order', events.every((e, i) => e.number === i + 1));
check('ids unique', new Set(events.map((e) => e.id)).size === events.length);
check('every event has a tagline', events.every((e) => e.tagline.trim().length > 0));
check(
  'every event has body text',
  events.every((e) => e.blocks.length > 0),
  events.filter((e) => !e.blocks.length).map((e) => e.title).join(', '),
);
check('8 diagrams', events.filter((e) => e.diagram).length === 8);
check(
  'Mystery and Quiz are the two without a diagram',
  events.filter((e) => !e.diagram).map((e) => e.title).join(',') === 'Mystery,Quiz',
);

// A path that resolves in the JSON but not on disk renders as a broken image.
const missing = events
  .filter((e) => e.diagram)
  .map((e) => e.diagram)
  .filter((src) => !existsSync(fileURLToPath(new URL(`../public${src}`, import.meta.url))));
check('every diagram file exists', missing.length === 0, missing.join(', '));

check('2 trailing sections', sections.length === 2, String(sections.length));
check(
  'points section kept',
  sections.some((s) => s.id === 'points-and-draft-slot-choice'),
);
check(
  'labels are strings',
  [...events, ...sections].every((item) =>
    item.blocks.every((b) => typeof b.label === 'string' && b.type === 'p'),
  ),
);

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
