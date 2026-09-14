export type Segment = { text: string; hit: boolean };

// Regex metacharacters appear in real rule text ("Buy-In", "4–7", "30%"),
// and matched terms are interpolated into a pattern, so they must be escaped.
function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Splits text into alternating plain and matched segments.
 *
 * Returns data rather than an HTML string: the caller renders segments as React
 * nodes, so markup injection is structurally impossible instead of merely
 * unlikely. Never build <mark> tags by string concatenation here.
 *
 * `terms` are the terms MiniSearch actually matched, not the raw user query —
 * prefix and fuzzy matching mean the two differ ("waiv" matches "waivers").
 */
export function highlightSegments(text: string, terms: string[]): Segment[] {
  if (!text || terms.length === 0) return [{ text, hit: false }];

  // Longest first: otherwise "trade" would consume the start of "trades"
  // and leave a stray fragment behind.
  const sorted = [...new Set(terms.filter(Boolean))].sort((a, b) => b.length - a.length);
  if (sorted.length === 0) return [{ text, hit: false }];

  const pattern = new RegExp(`(${sorted.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(pattern);

  // String.split with one capture group yields [plain, captured, plain, ...],
  // so odd indices are always the matches.
  return parts
    .map((part, index) => ({ text: part, hit: index % 2 === 1 }))
    .filter((segment) => segment.text.length > 0);
}
