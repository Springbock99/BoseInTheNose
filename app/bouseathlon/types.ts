// Shapes app/data/bouseathlon.json. That file is hand-edited (seeded once by
// scripts/build-bouseathlon.mjs), so it is the source of truth, not the .docx.

// `label` groups consecutive paragraphs under a heading like "Scoring". An
// empty label means the paragraph stands on its own.
export type Block = { type: 'p'; text: string; label: string };

export type Event = {
  number: number;
  title: string;
  id: string;
  tagline: string;
  diagram: string | null;
  blocks: Block[];
};

export type Section = {
  id: string;
  title: string;
  blocks: Block[];
};

export type Guide = {
  title: string;
  standfirst: string;
  sourceDoc: string;
  generatedAt: string;
  events: Event[];
  sections: Section[];
};
