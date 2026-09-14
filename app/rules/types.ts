export type TextBlock = { type: 'p' | 'li'; text: string };
export type TableBlock = { type: 'table'; rows: string[][] };
export type Block = TextBlock | TableBlock;

export type Rule = {
  id: string;
  title: string;
  blocks: Block[];
};

export type Chapter = {
  id: string;
  number: number | null;
  title: string;
  kind: 'chapter';
  rules: Rule[];
};

export type Definition = { term: string; text: string };

export type Rulebook = {
  title: string;
  generatedAt: string;
  frontMatter: string[];
  chapters: Chapter[];
  glossary: Definition[];
};
