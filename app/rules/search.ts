import MiniSearch from 'minisearch';
import type { Rulebook } from './types';

export type SearchResult = {
  ruleIds: Set<string>;
  chapterIds: Set<string>;
  terms: string[];
  ruleCount: number;
  chapterCount: number;
};

export const EMPTY_RESULT: SearchResult = {
  ruleIds: new Set(),
  chapterIds: new Set(),
  terms: [],
  ruleCount: 0,
  chapterCount: 0,
};

type Doc = {
  id: string;
  chapterId: string;
  title: string;
  text: string;
};

// A query that looks like a rule reference: "7", "7.3", "G.1", "A.2".
const ID_QUERY = /^([A-Za-z]\.)?\d+(\.\d+)*\.?$/;

export function toDocuments(rulebook: Rulebook): Doc[] {
  return rulebook.chapters.flatMap((chapter) =>
    chapter.rules.map((rule) => ({
      id: rule.id,
      chapterId: chapter.id,
      title: rule.title,
      // Table cells are indexed too: "passing touchdown" and "6" only exist
      // inside the scoring table.
      text: rule.blocks
        .map((block) => (block.type === 'table' ? block.rows.flat().join(' ') : block.text))
        .join(' '),
    })),
  );
}

export function buildIndex(rulebook: Rulebook): MiniSearch<Doc> {
  const index = new MiniSearch<Doc>({
    fields: ['title', 'text'],
    storeFields: ['chapterId'],
  });
  index.addAll(toDocuments(rulebook));
  return index;
}

/**
 * Rule IDs bypass the index.
 *
 * MiniSearch tokenizes "7.3" into ["7", "3"] — the same token set as "3.7" — so
 * an indexed lookup cannot distinguish them and ranks the wrong rule first.
 * An ID-shaped query is answered by exact prefix matching on the id instead.
 */
function searchById(rulebook: Rulebook, query: string): SearchResult {
  const needle = query.replace(/\.$/, '').toLowerCase();
  const ruleIds = new Set<string>();
  const chapterIds = new Set<string>();

  for (const chapter of rulebook.chapters) {
    for (const rule of chapter.rules) {
      const id = rule.id.toLowerCase();
      // "7" matches 7.1..7.11 but not 17.1; "7.3" matches 7.3 exactly.
      if (id === needle || id.startsWith(`${needle}.`)) {
        ruleIds.add(rule.id);
        chapterIds.add(chapter.id);
      }
    }
  }

  return {
    ruleIds,
    chapterIds,
    terms: [],
    ruleCount: ruleIds.size,
    chapterCount: chapterIds.size,
  };
}

export function searchRules(
  index: MiniSearch<Doc>,
  rulebook: Rulebook,
  rawQuery: string,
): SearchResult {
  const query = rawQuery.trim();
  if (query.length === 0) return EMPTY_RESULT;
  if (ID_QUERY.test(query)) return searchById(rulebook, query);

  const results = index.search(query, {
    boost: { title: 3, text: 1 },
    // Short terms stay exact: fuzzy matching on two letters makes everything
    // match everything, and a 2-char prefix matches most of the document.
    prefix: (term) => term.length > 2,
    fuzzy: (term) => (term.length > 3 ? 0.2 : false),
    combineWith: 'AND',
  });

  const ruleIds = new Set<string>();
  const chapterIds = new Set<string>();
  const terms = new Set<string>();

  for (const result of results) {
    ruleIds.add(result.id as string);
    chapterIds.add(result.chapterId as string);
    // result.match maps the terms the index actually matched to the fields they
    // hit — these, not the raw query, are what gets highlighted.
    for (const term of Object.keys(result.match)) terms.add(term);
  }

  return {
    ruleIds,
    chapterIds,
    terms: [...terms],
    ruleCount: ruleIds.size,
    chapterCount: chapterIds.size,
  };
}
