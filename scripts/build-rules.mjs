// Derives app/data/rules.json from the master rulebook .docx.
//
// The .docx is the single source of truth. Never hand-edit rules.json —
// amend the document, then re-run `npm run rules`.
//
// Word styles map onto the content model:
//   Tittel       -> document title
//   Overskrift1  -> chapter heading
//   Overskrift2  -> rule heading ("7.3 Trade Deadline")
//   Normal       -> body paragraph
//   Punktliste   -> bullet item

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = resolve(root, 'docs/rulebook-master.docx');
const TARGET = resolve(root, 'app/data/rules.json');

// The table of contents duplicates the chapter list we render ourselves.
const DROPPED_SECTIONS = new Set(['Contents']);
// Flat "Term: definition" paragraphs rather than numbered rules.
const GLOSSARY_SECTION = 'Definitions and Terminology';

const RULE_ID = /^([A-Za-z]?\.?\d+(?:\.\d+)*)\s+(.+)$/;
const VALID_ID = /^([A-Z]\.)?\d+(\.\d+)*$/;

const EXPECTED = { rules: 143, chapters: 19, definitions: 19 };

function unescapeXml(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&');
}

// Word splits a sentence across many <w:t> runs whenever formatting changes,
// so the paragraph text is every run concatenated in document order.
function paragraphText(xml) {
  const runs = xml.match(/<w:t(?:\s[^>]*)?>[\s\S]*?<\/w:t>/g) || [];
  const text = runs
    .map((run) => unescapeXml(run.replace(/^<w:t(?:\s[^>]*)?>/, '').replace(/<\/w:t>$/, '')))
    .join('')
    .replace(/ /g, ' ');
  return text.trim();
}

function paragraphStyle(xml) {
  const match = xml.match(/<w:pStyle\s+w:val="([^"]+)"/);
  return match ? match[1] : 'Normal';
}

// Cells hold their own <w:p> runs; join them so a multi-paragraph cell reads
// as one value.
function cellText(xml) {
  const paragraphs = xml.match(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g) || [];
  return paragraphs.map(paragraphText).filter(Boolean).join(' ');
}

function tableRows(xml) {
  const rows = xml.match(/<w:tr(?:\s[^>]*)?>[\s\S]*?<\/w:tr>/g) || [];
  return rows
    .map((row) => (row.match(/<w:tc>[\s\S]*?<\/w:tc>/g) || []).map(cellText))
    .filter((cells) => cells.some((cell) => cell.length > 0));
}

function chapterNumber(title) {
  const match = title.match(/^Chapter\s+(\d+)/i);
  return match ? Number(match[1]) : null;
}

function chapterSlug(title) {
  const number = chapterNumber(title);
  if (number !== null) return `ch-${number}`;
  const appendix = title.match(/^Appendix\s+([A-Z])/i);
  if (appendix) return `appendix-${appendix[1].toLowerCase()}`;
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function fail(message) {
  console.error(`\n  build-rules failed: ${message}\n`);
  process.exit(1);
}

async function main() {
  const zip = await JSZip.loadAsync(await readFile(SOURCE));
  const entry = zip.file('word/document.xml');
  if (!entry) fail('word/document.xml missing — is this a real .docx?');

  const xml = await entry.async('string');

  // Top-level nodes in document order. Tables are matched first so a <w:tbl> is
  // consumed whole — otherwise the <w:p> elements inside its cells would be
  // picked up as loose body paragraphs and the table structure would be lost.
  const nodes = (xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>|<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g) || [])
    .map((node) =>
      node.startsWith('<w:tbl>')
        ? { kind: 'table', rows: tableRows(node) }
        : { kind: 'paragraph', style: paragraphStyle(node), text: paragraphText(node) },
    )
    .filter((node) => (node.kind === 'table' ? node.rows.length > 0 : node.text.length > 0));

  if (nodes.length === 0) fail('no content parsed from document.xml');

  // A nested table would break the non-greedy match above, silently truncating
  // the outer table at the inner one's closing tag.
  const nestedTable = (xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g) || []).some((t) =>
    t.slice(7).includes('<w:tbl>'),
  );
  if (nestedTable) fail('nested tables are not supported');
  const tableCount = nodes.filter((n) => n.kind === 'table').length;

  const rulebook = {
    title: '',
    generatedAt: new Date().toISOString(),
    frontMatter: [],
    chapters: [],
    glossary: [],
  };

  let chapter = null;   // current chapter being filled
  let rule = null;      // current rule being filled
  let dropping = false; // inside a section we discard entirely
  let inGlossary = false;
  let droppedSections = 0;

  for (const node of nodes) {
    if (node.kind === 'table') {
      if (!rule) continue; // a table outside any rule has no home in the model
      rule.blocks.push({ type: 'table', rows: node.rows });
      continue;
    }

    const { style, text } = node;

    if (style === 'Tittel') {
      rulebook.title = text;
      continue;
    }

    if (style === 'Overskrift1') {
      rule = null;
      dropping = DROPPED_SECTIONS.has(text);
      inGlossary = text === GLOSSARY_SECTION;

      if (dropping) {
        droppedSections += 1;
        chapter = null;
        continue;
      }
      if (inGlossary) {
        chapter = null;
        continue;
      }

      chapter = {
        id: chapterSlug(text),
        number: chapterNumber(text),
        title: text,
        kind: 'chapter',
        rules: [],
      };
      rulebook.chapters.push(chapter);
      continue;
    }

    if (dropping) continue;

    if (inGlossary) {
      const split = text.indexOf(':');
      if (split === -1) fail(`glossary entry has no colon: "${text.slice(0, 60)}"`);
      rulebook.glossary.push({
        term: text.slice(0, split).trim(),
        text: text.slice(split + 1).trim(),
      });
      continue;
    }

    if (style === 'Overskrift2') {
      if (!chapter) fail(`rule "${text.slice(0, 40)}" appears before any chapter heading`);
      const match = text.match(RULE_ID);
      if (!match) fail(`rule heading has no parseable id: "${text.slice(0, 60)}"`);
      rule = { id: match[1], title: match[2].trim(), blocks: [] };
      chapter.rules.push(rule);
      continue;
    }

    // Body text before the first chapter heading is document front matter.
    if (!chapter) {
      rulebook.frontMatter.push(text);
      continue;
    }

    if (!rule) continue; // chapter preamble prose, not part of a rule

    // One ordered array, not separate body/bullets arrays: splitting content by
    // type discards document order, which matters when a paragraph introduces or
    // qualifies the list beside it.
    rule.blocks.push({ type: style === 'Punktliste' ? 'li' : 'p', text });
  }

  // Validation — a partially-correct rules.json is worse than no update.
  const rules = rulebook.chapters.flatMap((c) => c.rules);
  const ids = rules.map((r) => r.id);

  if (!rulebook.title) fail('no document title (Tittel) found');
  if (rules.length !== EXPECTED.rules)
    fail(`expected ${EXPECTED.rules} rules, parsed ${rules.length}`);
  if (rulebook.chapters.length !== EXPECTED.chapters)
    fail(`expected ${EXPECTED.chapters} chapters, parsed ${rulebook.chapters.length}`);
  if (rulebook.glossary.length !== EXPECTED.definitions)
    fail(`expected ${EXPECTED.definitions} definitions, parsed ${rulebook.glossary.length}`);
  if (droppedSections !== DROPPED_SECTIONS.size)
    fail(`expected to drop ${DROPPED_SECTIONS.size} section(s), dropped ${droppedSections}`);

  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicates.length) fail(`duplicate rule ids: ${[...new Set(duplicates)].join(', ')}`);

  const malformed = ids.filter((id) => !VALID_ID.test(id));
  if (malformed.length) fail(`malformed rule ids: ${malformed.join(', ')}`);

  const parsedTables = rules.reduce(
    (total, r) => total + r.blocks.filter((b) => b.type === 'table').length,
    0,
  );
  if (parsedTables !== tableCount)
    fail(`parsed ${parsedTables} tables but the document has ${tableCount}`);

  const raggedTable = rules.find((r) =>
    r.blocks.some((b) => b.type === 'table' && new Set(b.rows.map((row) => row.length)).size > 1),
  );
  if (raggedTable) fail(`table in rule ${raggedTable.id} has rows of differing width`);

  const empty = rules.filter((r) => r.blocks.length === 0);
  if (empty.length) fail(`rules with no content: ${empty.map((r) => r.id).join(', ')}`);

  const emptyChapters = rulebook.chapters.filter((c) => c.rules.length === 0);
  if (emptyChapters.length)
    fail(`chapters with no rules: ${emptyChapters.map((c) => c.title).join(', ')}`);

  await mkdir(dirname(TARGET), { recursive: true });
  await writeFile(TARGET, `${JSON.stringify(rulebook, null, 2)}\n`);

  console.log(`  ${rulebook.chapters.length} chapters`);
  console.log(`  ${rules.length} rules`);
  console.log(`  ${rulebook.glossary.length} definitions`);
  console.log(`  ${parsedTables} tables`);
  console.log(`  ${rulebook.frontMatter.length} front-matter paragraphs`);
  console.log(`  -> app/data/rules.json`);
}

main().catch((error) => fail(error.message));
