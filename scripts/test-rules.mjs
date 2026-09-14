// Tests the real modules in app/rules/ via Node's type stripping.
// Run: npm run test:rules
import { readFileSync } from 'node:fs';
import { buildIndex, searchRules } from '../app/rules/search.ts';
import { highlightSegments } from '../app/rules/highlight.ts';

const rulebook = JSON.parse(readFileSync(new URL('../app/data/rules.json', import.meta.url), 'utf8'));
const index = buildIndex(rulebook);
const search = (q) => searchRules(index, rulebook, q);
const ids = (q) => [...search(q).ruleIds];

let pass = 0;
let fail = 0;
const check = (name, cond, detail = '') => {
  if (cond) pass += 1;
  else fail += 1;
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}${!cond && detail ? `  -> ${detail}` : ''}`);
};

console.log('\n=== converter output ===');
const rules = rulebook.chapters.flatMap((c) => c.rules);
check('143 rules', rules.length === 143, String(rules.length));
check('19 chapters', rulebook.chapters.length === 19, String(rulebook.chapters.length));
check('19 definitions', rulebook.glossary.length === 19, String(rulebook.glossary.length));
check('front matter collected', rulebook.frontMatter.length === 5, String(rulebook.frontMatter.length));
check('ids unique', new Set(rules.map((r) => r.id)).size === rules.length);
check('every rule has content', rules.every((r) => r.blocks.length > 0));
check('no TOC chapter', !rulebook.chapters.some((c) => c.title === 'Contents'));
check('block order preserved in 14.2', (() => {
  const r = rules.find((x) => x.id === '14.2');
  const firstLi = r.blocks.findIndex((b) => b.type === 'li');
  const lastLi = r.blocks.map((b) => b.type).lastIndexOf('li');
  return r.blocks[firstLi - 1].type === 'p' && r.blocks[lastLi + 1]?.type === 'p';
})());

console.log('\n=== tables ===');
const tables = rules.flatMap((r) => r.blocks.filter((b) => b.type === 'table'));
check('10 tables parsed', tables.length === 10, String(tables.length));
check('every table has >=2 rows', tables.every((t) => t.rows.length >= 2));
check('every table is rectangular', tables.every((t) => new Set(t.rows.map((r) => r.length)).size === 1));
check('no table cell text leaked as loose paragraph', !rules.some((r) => r.blocks.some((b) => b.type !== 'table' && b.text === 'Points')));
check('scoring table findable by cell text', ids('passing touchdown').length > 0, JSON.stringify(ids('passing touchdown')));

console.log('\n=== id lookup (tokenization bypass) ===');
check('"7.3" returns exactly 7.3', JSON.stringify(ids('7.3')) === '["7.3"]', JSON.stringify(ids('7.3')));
check('"3.7" returns exactly 3.7', JSON.stringify(ids('3.7')) === '["3.7"]', JSON.stringify(ids('3.7')));
check('"7" returns ch.7 only', ids('7').length === 11 && ids('7').every((x) => x.startsWith('7.')), JSON.stringify(ids('7')));
check('"G.1" returns G.1', JSON.stringify(ids('G.1')) === '["G.1"]', JSON.stringify(ids('G.1')));
check('id query sets chapterIds', search('7.3').chapterIds.has('ch-7'));

console.log('\n=== text search ===');
check('"waiv" finds 6.1', ids('waiv').includes('6.1'));
check('"waivr" typo finds 6.1', ids('waivr').includes('6.1'));
check('"trade deadline" finds something', ids('trade deadline').length > 0);
check('nonsense finds nothing', ids('zzzzqqq').length === 0);
check('blank query is empty', search('   ').ruleCount === 0);
check('counts agree', (() => { const r = search('toilet bowl'); return r.ruleCount === r.ruleIds.size && r.chapterCount === r.chapterIds.size; })());

console.log('\n=== highlight ===');
const terms = search('toilet bowl').terms;
check('matched terms returned', terms.length > 0, JSON.stringify(terms));
check('marks the match', highlightSegments('The Toilet Bowl decides it.', terms).some((s) => s.hit && /toilet/i.test(s.text)));
check('round-trips text', highlightSegments('The Toilet Bowl decides it.', terms).map((s) => s.text).join('') === 'The Toilet Bowl decides it.');
check('regex metachars safe', highlightSegments('Buy-In is 30% (net).', ['30%', '(net)']).map((s) => s.text).join('') === 'Buy-In is 30% (net).');
check('no terms passthrough', highlightSegments('abc', []).length === 1);
check('longest term wins', (() => { const s = highlightSegments('waivers', ['waiv', 'waivers']); return s.length === 1 && s[0].hit; })());
check('empty text safe', highlightSegments('', ['a']).length === 1);

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
