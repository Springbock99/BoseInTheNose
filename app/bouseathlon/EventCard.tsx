'use client';

import type { Block, Event } from './types';

// Consecutive paragraphs sharing a label render under one heading; an empty
// label starts an unheaded group of its own.
function groupBlocks(blocks: Block[]): { label: string; texts: string[] }[] {
  const groups: { label: string; texts: string[] }[] = [];
  for (const block of blocks) {
    const last = groups[groups.length - 1];
    if (last && last.label === block.label && block.label) last.texts.push(block.text);
    else groups.push({ label: block.label, texts: [block.text] });
  }
  return groups;
}

function EventNumber({ value, large }: { value: number; large?: boolean }) {
  return (
    <span
      className={`font-mono font-bold tabular-nums text-[#62dfff] ${
        large ? 'text-base' : 'text-xs'
      }`}
    >
      {String(value).padStart(2, '0')}
    </span>
  );
}

// The diagrams are dark-on-white artwork lifted from the printed guide. They
// sit on their own light panel rather than being recoloured, so what is on
// screen matches what people have on paper.
function Diagram({
  src,
  title,
  onZoom,
  compact,
}: {
  src: string;
  title: string;
  onZoom?: () => void;
  compact?: boolean;
}) {
  const image = (
    // eslint-disable-next-line @next/next/no-img-element -- static local asset, no remote loader needed
    <img
      src={src}
      alt={`Diagram of the ${title} event`}
      loading="lazy"
      className={compact ? 'max-h-full w-auto object-contain' : 'w-full object-contain'}
    />
  );
  // Tile thumbnails share a fixed height so the grid rows line up — the source
  // diagrams range from 3:1 to 5:3.
  if (compact) {
    return <div className="flex h-32 items-center justify-center bg-white p-2">{image}</div>;
  }
  if (!onZoom) return <div className="bg-white p-3">{image}</div>;
  return (
    <button
      type="button"
      onClick={onZoom}
      aria-label={`Enlarge the ${title} diagram`}
      className="group/zoom relative block w-full cursor-zoom-in bg-white p-4"
    >
      {image}
      <span className="absolute bottom-2 right-2 bg-[#050608]/80 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70 opacity-0 transition group-hover/zoom:opacity-100">
        Enlarge
      </span>
    </button>
  );
}

function MysteryPanel({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center border border-dashed border-[#a78bfa]/35 bg-[#a78bfa]/[0.06] ${
        compact ? 'h-32' : 'py-8'
      }`}
    >
      <span aria-hidden className="text-4xl font-black text-[#a78bfa]/70">
        ?
      </span>
    </div>
  );
}

export default function EventCard({
  event,
  isOpen,
  onToggle,
  onZoom,
}: {
  event: Event;
  isOpen: boolean;
  onToggle: () => void;
  onZoom: (event: Event) => void;
}) {
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={false}
        // The tile and the open panel share one transition name, so the
        // browser treats them as the same box growing rather than one element
        // disappearing and another appearing.
        style={{ viewTransitionName: `event-${event.id}` }}
        className="group flex h-full scroll-mt-24 flex-col border border-white/10 bg-[#0b0d12]/85 p-4 text-left transition-colors hover:border-[#62dfff]/45 hover:bg-[#11141b]"
      >
        <div className="flex items-baseline justify-between gap-3">
          <EventNumber value={event.number} />
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/25 transition group-hover:text-[#62dfff]">
            Open
          </span>
        </div>
        <h2 className="mt-2 text-xl font-black uppercase leading-tight tracking-tight text-white">
          {event.title}
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-white/50">{event.tagline}</p>
        {/* mt-auto pins the thumbnail to the bottom, so a two-line tagline
            does not shift it out of line with its neighbours. */}
        <div className="mt-auto pt-4">
          {event.diagram ? (
            <Diagram src={event.diagram} title={event.title} compact />
          ) : (
            <MysteryPanel compact />
          )}
        </div>
      </button>
    );
  }

  const groups = groupBlocks(event.blocks);

  return (
    <article
      id={event.id}
      style={{ viewTransitionName: `event-${event.id}` }}
      // Takes the full row so the diagram and rules get the page width.
      className="col-span-full scroll-mt-24 border border-[#62dfff]/40 bg-[#0b0d12]/92"
    >
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div>
          <EventNumber value={event.number} large />
          <h2 className="mt-1 text-2xl font-black uppercase leading-none tracking-tight text-white sm:text-3xl">
            {event.title}
          </h2>
          <p className="mt-2 text-sm text-white/50">{event.tagline}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded
          className="shrink-0 border border-white/12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45 transition hover:border-[#62dfff]/40 hover:text-[#62dfff]"
        >
          Close
        </button>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {event.diagram ? (
          <Diagram src={event.diagram} title={event.title} onZoom={() => onZoom(event)} />
        ) : (
          <MysteryPanel />
        )}

        <div className="space-y-5">
          {groups.map((group, index) => (
            <div key={index}>
              {group.label && (
                <h3 className="mb-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#a78bfa]">
                  {group.label}
                </h3>
              )}
              {group.texts.map((text, textIndex) => (
                <p key={textIndex} className="mt-1.5 text-sm leading-7 text-white/68">
                  {text}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
