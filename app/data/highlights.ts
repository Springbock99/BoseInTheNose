// Real NFL archive videos for the design preview. Do not label this collection
// as the current week. A weekly feed should supply verified season/week metadata
// and a source-check timestamp before replacing the preview flag.
export type Highlight = {
  id: string;
  title: string;
  category: 'Catches' | 'Player reels';
  caption: string;
  sourceTitle: string;
};

export const highlightsPreview = {
  label: '2024 season archive',
  source: 'NFL',
  preview: true,
  videos: [
    {
      id: '53rorKYrPHY',
      title: 'How did he catch that?',
      category: 'Catches',
      caption: 'One-handed grabs. Toe taps. Absolutely no business catching it.',
      sourceTitle: 'Top Catches of the 2024 Season!',
    },
    {
      id: '7r8p9NsxUzQ',
      title: 'The Justin Jefferson show.',
      category: 'Player reels',
      caption: 'The kind of Sundays your opponent would rather forget.',
      sourceTitle: 'Justin Jefferson Top Plays of the 2024 Season',
    },
    {
      id: 'ZuEmMaaVGYE',
      title: 'Sonic. Knuckles. Six points.',
      category: 'Player reels',
      caption: 'Jahmyr Gibbs and David Montgomery, making defenders reconsider.',
      sourceTitle: 'Sonic & Knuckles Top Plays of the 2024 Regular Season',
    },
  ] satisfies Highlight[],
};
