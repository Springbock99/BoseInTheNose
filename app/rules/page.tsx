import type { Metadata } from 'next';
import RulesBrowser from './RulesBrowser';
import rulebookJson from '../data/rules.json';
import type { Rulebook } from './types';

export const metadata: Metadata = {
  title: 'Rulebook · Bose In The Nose',
  description: 'Searchable master rulebook for the BouseInTheNose fantasy football league.',
};

// Imported at build time, so the page ships with the rulebook inlined —
// no fetch, no loading state, no network error path.
const rulebook = rulebookJson as unknown as Rulebook;

export default function RulesPage() {
  return <RulesBrowser rulebook={rulebook} />;
}
