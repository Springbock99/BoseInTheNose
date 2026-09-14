'use client';

import RuleCard from './RuleCard';
import type { Chapter } from './types';

export default function ChapterPanel({
  chapter,
  isOpen,
  onToggle,
  visibleRuleIds,
  terms,
  targetRuleId,
  matchCount,
}: {
  chapter: Chapter;
  isOpen: boolean;
  onToggle: () => void;
  visibleRuleIds: Set<string> | null;
  terms: string[];
  targetRuleId: string | null;
  matchCount: number | null;
}) {
  const rules = visibleRuleIds
    ? chapter.rules.filter((rule) => visibleRuleIds.has(rule.id))
    : chapter.rules;

  return (
    <section className="border border-white/10 bg-[#0b0d12]/70 backdrop-blur-md transition-colors hover:border-white/20">
      {/* Sticky so the collapse control stays reachable inside a long chapter. */}
      <h2 className="sticky top-0 z-10">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="flex w-full items-center gap-4 bg-[#0b0d12]/95 px-5 py-4 text-left backdrop-blur-md transition hover:bg-[#12151d]/95"
        >
          <span
            aria-hidden
            className={`text-[#62dfff] transition-transform duration-300 motion-reduce:transition-none ${
              isOpen ? 'rotate-90' : ''
            }`}
          >
            ▶
          </span>
          <span className="flex-1 text-base font-black uppercase tracking-[0.06em] text-white">
            {chapter.title}
          </span>
          {matchCount !== null && (
            <span className="shrink-0 bg-[#62dfff]/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#62dfff]">
              {matchCount} {matchCount === 1 ? 'match' : 'matches'}
            </span>
          )}
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-white/32">
            {chapter.rules.length} rules
          </span>
        </button>
      </h2>

      {/*
        Smooth auto-height: `height: auto` is not animatable, and max-height
        hacks animate toward a fake value so short panels snap and long ones
        lag. Grid rows interpolate 0fr -> 1fr against the real content height.
      */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.4,0,.2,1)] motion-reduce:transition-none ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-2">
            {rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                terms={terms}
                isTarget={rule.id === targetRuleId}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
