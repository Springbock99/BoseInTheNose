'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import PageBackground from '../PageBackground';
import EventCard from './EventCard';
import { withViewTransition } from './viewTransition';
import type { Event, Guide } from './types';

export default function EventGrid({ guide }: { guide: Guide }) {
  // One card open at a time: the grid is the overview, the open card is the
  // detail. Two expanded cards would push the rest off screen.
  const [openId, setOpenId] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState<Event | null>(null);

  const openEvent = useCallback(
    (id: string) => {
      if (!guide.events.some((event) => event.id === id)) return;
      void withViewTransition(() => setOpenId(id), {
        flavour: 'open',
        afterCommit: () => {
          // Switching straight from one open card to another changes the page
          // height, so the new card often lands off screen. Scroll instantly
          // here — inside the transition — and the browser animates the move
          // together with the card growing, as one gesture. Doing it after the
          // transition is what made switching feel like two separate steps.
          const card = document.getElementById(id);
          if (!card) return;
          const { top, bottom } = card.getBoundingClientRect();
          if (top < 0 || bottom > window.innerHeight) {
            // 'nearest' scrolls the minimum distance needed, which keeps the
            // travel short enough to read as one continuous movement.
            card.scrollIntoView({ behavior: 'instant', block: 'nearest' });
          }
        },
      });
    },
    [guide.events],
  );

  const closeEvent = useCallback(
    () => withViewTransition(() => setOpenId(null), { flavour: 'close' }),
    [],
  );

  // Deep links: /bouseathlon#kubb opens that event.
  useEffect(() => {
    const applyHash = () => {
      const id = decodeURIComponent(window.location.hash.replace('#', ''));
      if (id) openEvent(id);
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [openEvent]);

  // Escape closes the zoomed diagram first, then the open card.
  useEffect(() => {
    const onKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key !== 'Escape') return;
      if (zoomed) setZoomed(null);
      else if (openId) void closeEvent();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [zoomed, openId, closeEvent]);

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#050608] px-5 py-10 text-[#f5f8fb] sm:px-8">
      <PageBackground />

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Named, like the cards: when the transition also scrolls the page,
            a named element slides to its new position, while anything unnamed
            is left to cross-fade — which reads as a ghosted double image. */}
        <header
          style={{ viewTransitionName: 'guide-header' }}
          className="mb-12 flex items-center justify-between gap-4"
        >
          <Link
            href="/"
            className="border border-white/10 bg-black/20 px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] text-white/68 backdrop-blur-md transition hover:border-[#62dfff]/40 hover:text-[#62dfff]"
          >
            Back home
          </Link>
          <p className="text-right text-xs font-bold uppercase tracking-[0.18em] text-white/42">
            Draft combine
          </p>
        </header>

        <section style={{ viewTransitionName: 'guide-intro' }} className="mb-10">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.32em] text-[#62dfff]">
            Ten events, one draft order
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-[1.02] text-white sm:text-6xl">
            {guide.title}
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-white/52">{guide.standfirst}</p>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {guide.events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isOpen={openId === event.id}
              onToggle={() => (openId === event.id ? void closeEvent() : openEvent(event.id))}
              onZoom={setZoomed}
            />
          ))}
        </div>

        {guide.sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            // Named too, so they slide down as the grid grows instead of
            // cross-fading with the rest of the page.
            style={{ viewTransitionName: `section-${section.id}` }}
            className="mt-6 border border-[#a78bfa]/20 bg-[#0d0b16]/70 p-6 backdrop-blur-md"
          >
            <h2 className="text-xs font-black uppercase tracking-[0.22em] text-[#a78bfa]">
              {section.title}
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {section.blocks.map((block, index) => (
                <div key={index}>
                  {block.label && (
                    <h3 className="mb-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/38">
                      {block.label}
                    </h3>
                  )}
                  <p className="text-sm leading-7 text-white/68">{block.text}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <p
          style={{ viewTransitionName: 'guide-footnote' }}
          className="mt-10 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/25"
        >
          Event-day reference · the handbook has the complete rules
        </p>
      </div>

      {zoomed?.diagram && (
        <div
          role="dialog"
          aria-modal
          aria-label={`${zoomed.title} diagram`}
          onClick={() => setZoomed(null)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-[#050608]/90 p-4 backdrop-blur-sm sm:p-10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- static local asset, no remote loader needed */}
          <img
            src={zoomed.diagram}
            alt={`Diagram of the ${zoomed.title} event`}
            className="max-h-full w-auto max-w-full bg-white p-4"
          />
        </div>
      )}
    </main>
  );
}
