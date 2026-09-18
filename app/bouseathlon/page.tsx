import type { Metadata } from 'next';
import EventGrid from './EventGrid';
import guideJson from '../data/bouseathlon.json';
import type { Guide } from './types';

export const metadata: Metadata = {
  title: 'Bouseathlon · Bose In The Nose',
  description:
    'The ten draft-combine events, their scoring, and how the results decide draft order.',
};

// Imported at build time, so the page ships with the guide inlined —
// no fetch, no loading state, no network error path.
const guide = guideJson as Guide;

export default function BouseathlonPage() {
  return <EventGrid guide={guide} />;
}
