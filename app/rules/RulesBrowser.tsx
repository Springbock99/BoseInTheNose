'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageBackground from '../PageBackground';
import ChapterPanel from './ChapterPanel';
import { buildIndex, searchRules } from './search';
import type { Rulebook } from './types';

export default function RulesBrowser({ rulebook }: { rulebook: Rulebook }) {
  const [query, setQuery] = useState('');
  // The user's own open/closed choices, kept separate from search-forced opens
  // so clearing the search restores exactly what they had before.
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set());
  const [targetRuleId, setTargetRuleId] = useState<string | null>(null);

  // Index is built once, not per keystroke.
  const index = useMemo(() => buildIndex(rulebook), [rulebook]);
  const result = useMemo(() => searchRules(index, rulebook, query), [index, rulebook, query]);

  const isSearching = query.trim().length > 0;

  const openRule = useCallback(
    (ruleId: string) => {
      const chapter = rulebook.chapters.find((c) => c.rules.some((r) => r.id === ruleId));
      if (!chapter) return;
      setOpenChapters((previous) => new Set(previous).add(chapter.id));
      setTargetRuleId(ruleId);
      // Wait for the panel to expand before scrolling to a rule inside it.
      window.setTimeout(() => {
        document.getElementById(ruleId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 320);
    },
    [rulebook],
  );

  // Deep links: /rules#7.3 expands the chapter and scrolls to the rule.
  useEffect(() => {
    const applyHash = () => {
      const id = decodeURIComponent(window.location.hash.replace('#', ''));
      if (id) openRule(id);
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [openRule]);

  const toggleChapter = (chapterId: string) => {
    setOpenChapters((previous) => {
      const next = new Set(previous);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const visibleChapters = isSearching
    ? rulebook.chapters.filter((chapter) => result.chapterIds.has(chapter.id))
    : rulebook.chapters;

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#050608] px-5 py-10 text-[#f5f8fb] sm:px-8">
      <PageBackground />

      <div className="relative z-10 mx-auto max-w-5xl">
        <header className="mb-12 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="border border-white/10 bg-black/20 px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] text-white/68 backdrop-blur-md transition hover:border-[#62dfff]/40 hover:text-[#62dfff]"
          >
            Back home
          </Link>
          <p className="text-right text-xs font-bold uppercase tracking-[0.18em] text-white/42">
            Rulebook
          </p>
        </header>

        <section className="mb-10">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.32em] text-[#62dfff]">
            League law
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-[1.02] text-white sm:text-6xl">
            {rulebook.title}
          </h1>
          <div className="mt-6 space-y-1.5">
            {rulebook.frontMatter.slice(0, 4).map((line, index) => (
              <p
                key={index}
                className={
                  index === 0
                    ? 'text-xs font-black uppercase tracking-[0.2em] text-white/38'
                    : 'text-sm text-white/50'
                }
              >
                {line}
              </p>
            ))}
          </div>
        </section>

        {/* Search */}
        <div className="sticky top-0 z-20 -mx-2 mb-8 bg-[#050608]/85 px-2 py-4 backdrop-blur-lg">
          <div className="flex items-center gap-3 border border-white/12 bg-[#0b0d12]/80 px-4 py-3 focus-within:border-[#62dfff]/50">
            <span aria-hidden className="text-white/35">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search rules — try “trade deadline”, “waivers”, or “7.3”"
              aria-label="Search rules"
              className="w-full bg-transparent text-base text-white placeholder:text-white/28 focus:outline-none"
            />
            {isSearching && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="shrink-0 text-xs font-bold uppercase tracking-[0.14em] text-white/40 transition hover:text-[#62dfff]"
              >
                Clear
              </button>
            )}
          </div>
          {isSearching && (
            <p className="mt-2.5 text-xs font-bold uppercase tracking-[0.16em] text-white/45">
              {result.ruleCount === 0
                ? 'No rules match'
                : `${result.ruleCount} ${result.ruleCount === 1 ? 'rule' : 'rules'} in ${result.chapterCount} ${
                    result.chapterCount === 1 ? 'chapter' : 'chapters'
                  }`}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {visibleChapters.map((chapter) => {
            const matches = isSearching
              ? chapter.rules.filter((rule) => result.ruleIds.has(rule.id)).length
              : null;
            return (
              <ChapterPanel
                key={chapter.id}
                chapter={chapter}
                // Searching force-opens matching chapters; browsing uses the
                // user's own open set.
                isOpen={isSearching ? true : openChapters.has(chapter.id)}
                onToggle={() => toggleChapter(chapter.id)}
                visibleRuleIds={isSearching ? result.ruleIds : null}
                terms={result.terms}
                targetRuleId={targetRuleId}
                matchCount={matches}
              />
            );
          })}
        </div>

        {isSearching && result.ruleCount === 0 && (
          <div className="border border-white/10 bg-[#0b0d12]/70 px-6 py-12 text-center">
            <p className="text-lg font-black text-white">No rules match “{query}”</p>
            <p className="mt-2 text-sm text-white/45">
              Try fewer words, or a rule number like 7.3
            </p>
          </div>
        )}

        {/* Glossary */}
        {!isSearching && (
          <section className="mt-12 border border-[#a78bfa]/20 bg-[#0d0b16]/70 p-6 backdrop-blur-md">
            <h2 className="text-xs font-black uppercase tracking-[0.22em] text-[#a78bfa]">
              Definitions and Terminology
            </h2>
            <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {rulebook.glossary.map((definition) => (
                <div key={definition.term}>
                  <dt className="text-sm font-black text-white">{definition.term}</dt>
                  <dd className="mt-1 text-sm leading-6 text-white/52">{definition.text}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <p className="mt-10 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">
          Generated from the master rulebook · {rulebook.chapters.reduce((n, c) => n + c.rules.length, 0)} rules
        </p>
      </div>
    </main>
  );
}
