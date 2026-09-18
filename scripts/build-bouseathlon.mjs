// Seeds app/data/bouseathlon.json and public/bouseathlon/*.png from the
// Bouseathlon quick-guide .docx.
//
// Unlike `npm run rules`, this is a ONE-TIME seed, not a pipeline: once the
// JSON exists it is the source of truth and is edited by hand (taglines and
// section labels live there, not in the .docx). Re-running overwrites those
// edits, so it refuses to clobber an existing file without --force.
//
// Document shape it expects:
//   Title            -> guide title
//   Normal (first)   -> standfirst paragraph
//   Heading1/2       -> "<n> <Event name>" or a trailing named section
//   Normal + <w:drawing> -> that event's diagram
//   Normal           -> body paragraph

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = resolve(root, 'docs/bouseathlon-quick-guide.docx');
const TARGET = resolve(root, 'app/data/bouseathlon.json');
const IMAGE_DIR = resolve(root, 'public/bouseathlon');

const EXPECTED = { events: 10, diagrams: 8 };

// "1 Field Goal" -> number 1, title "Field Goal". Word numbers these by hand,
// so the digits are part of the heading text rather than a list format.
const EVENT_HEADING = /^(\d+)\s+(.+)$/;

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
  return runs
    .map((run) => unescapeXml(run.replace(/^<w:t(?:\s[^>]*)?>/, '').replace(/<\/w:t>$/, '')))
    .join('')
    .replace(/ /g, ' ')
    .trim();
}

function paragraphStyle(xml) {
  const match = xml.match(/<w:pStyle\s+w:val="([^"]+)"/);
  return match ? match[1] : 'Normal';
}

// The relationship id on the image reference; resolved to a media path below.
function paragraphImage(xml) {
  const match = xml.match(/r:embed="([^"]+)"/);
  return match ? match[1] : null;
}

function slug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function fail(message) {
  console.error(`\n  build-bouseathlon failed: ${message}\n`);
  process.exit(1);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const force = process.argv.includes('--force');
  if ((await exists(TARGET)) && !force) {
    fail(
      `${TARGET} already exists and is hand-edited.\n` +
        '  Re-seeding would discard taglines and section labels. Pass --force if that is what you want.',
    );
  }

  const zip = await JSZip.loadAsync(await readFile(SOURCE));
  const entry = zip.file('word/document.xml');
  if (!entry) fail('word/document.xml missing — is this a real .docx?');
  const xml = await entry.async('string');

  // rId -> media path, so an inline image can be traced back to its file.
  const relsEntry = zip.file('word/_rels/document.xml.rels');
  if (!relsEntry) fail('word/_rels/document.xml.rels missing');
  const relsXml = await relsEntry.async('string');
  const mediaByRel = new Map(
    [...relsXml.matchAll(/Id="([^"]+)"[^>]*Target="(media\/[^"]+)"/g)].map((m) => [m[1], m[2]]),
  );

  const paragraphs = (xml.match(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g) || []).map((node) => ({
    style: paragraphStyle(node),
    text: paragraphText(node),
    image: paragraphImage(node),
  }));
  if (paragraphs.length === 0) fail('no paragraphs parsed from document.xml');

  const guide = {
    title: '',
    standfirst: '',
    sourceDoc: 'docs/bouseathlon-quick-guide.docx',
    generatedAt: new Date().toISOString(),
    events: [],
    sections: [],
  };

  let current = null; // the event or trailing section being filled
  const writes = [];

  for (const node of paragraphs) {
    if (node.style === 'Title') {
      guide.title = node.text;
      continue;
    }

    // Headings 1 and 2 are used interchangeably in the source document, so
    // treat any heading level as a section break rather than a hierarchy.
    if (node.style.startsWith('Heading')) {
      const match = node.text.match(EVENT_HEADING);
      if (match) {
        current = {
          number: Number(match[1]),
          title: match[2],
          id: slug(match[2]),
          // Filled in by hand after seeding.
          tagline: '',
          diagram: null,
          blocks: [],
        };
        guide.events.push(current);
      } else {
        current = { id: slug(node.text), title: node.text, blocks: [] };
        guide.sections.push(current);
      }
      continue;
    }

    if (node.image) {
      if (!current || current.number === undefined) continue; // only events carry a diagram
      const media = mediaByRel.get(node.image);
      if (!media) fail(`image ${node.image} has no matching relationship`);
      const file = zip.file(`word/${media}`);
      if (!file) fail(`word/${media} missing from the archive`);
      const name = `event-${String(current.number).padStart(2, '0')}.png`;
      writes.push(
        file.async('nodebuffer').then((buffer) => writeFile(resolve(IMAGE_DIR, name), buffer)),
      );
      current.diagram = `/bouseathlon/${name}`;
      continue;
    }

    if (!node.text) continue;
    if (!current) {
      // Everything before the first heading is the standfirst.
      guide.standfirst = guide.standfirst ? `${guide.standfirst} ${node.text}` : node.text;
      continue;
    }
    current.blocks.push({ type: 'p', text: node.text, label: '' });
  }

  if (guide.events.length !== EXPECTED.events) {
    fail(`expected ${EXPECTED.events} events, parsed ${guide.events.length}`);
  }
  const diagrams = guide.events.filter((event) => event.diagram).length;
  if (diagrams !== EXPECTED.diagrams) {
    fail(`expected ${EXPECTED.diagrams} diagrams, parsed ${diagrams}`);
  }
  const misnumbered = guide.events.find((event, index) => event.number !== index + 1);
  if (misnumbered) fail(`events are out of order at "${misnumbered.title}"`);

  await mkdir(IMAGE_DIR, { recursive: true });
  await Promise.all(writes);
  await mkdir(dirname(TARGET), { recursive: true });
  await writeFile(TARGET, `${JSON.stringify(guide, null, 2)}\n`);

  const empty = guide.events.filter((event) => !event.blocks.length).map((e) => e.title);
  console.log(`  ${guide.events.length} events, ${diagrams} diagrams -> ${TARGET}`);
  if (empty.length) console.log(`  no body text: ${empty.join(', ')}`);
  console.log('  Next: fill in tagline and block labels by hand.');
}

main().catch((error) => fail(error.message));
