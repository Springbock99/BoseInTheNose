'use client';

import { useState } from 'react';
import { highlightsPreview } from './data/highlights';
import HighlightPlayer from './HighlightPlayer';

function PlayIcon({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}><path d="M8 5v14l11-7z" /></svg>;
}

export default function WeeklyHighlights() {
  const [selectedId, setSelectedId] = useState(highlightsPreview.videos[0].id);
  const [playing, setPlaying] = useState(false);
  const [filter, setFilter] = useState('All plays');
  const selected = highlightsPreview.videos.find((video) => video.id === selectedId) ?? highlightsPreview.videos[0];
  const videos = highlightsPreview.videos.filter((video) => filter === 'All plays' || video.category === filter);

  return (
    <section id="highlights" aria-labelledby="highlights-title" className="relative z-10 mx-auto max-w-7xl scroll-mt-24 px-5 pb-16 sm:px-8 lg:pb-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-3 flex items-center gap-2 text-[0.65rem] font-black uppercase tracking-[0.24em] text-[#f9d98a]"><span aria-hidden="true" className="h-1.5 w-1.5 bg-[#f9d98a]" />The replay room</p>
          <h2 id="highlights-title" className="text-3xl font-black tracking-tight text-white sm:text-4xl">Plays of the week.</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/55">The moments that won matchups. Or ruined your Sunday.</p>
        </div>
        <span className="border border-[#f9d98a]/25 bg-[#f9d98a]/5 px-3 py-2 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[#f9d98a]">Design preview · Archive footage</span>
      </div>

      <div className="overflow-hidden border border-white/15 bg-[#0b0d14]/95 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="h-1 bg-gradient-to-r from-[#f9d98a] via-[#f9d98a]/35 to-transparent" />
        <div className="grid lg:grid-cols-[1.65fr_1fr]">
          <div className="min-w-0 border-b border-white/10 lg:border-b-0 lg:border-r">
            <div className="relative aspect-video bg-black">
              {playing ? (
                <HighlightPlayer key={selected.id} videoId={selected.id} title={selected.sourceTitle} />
              ) : (
                <button type="button" onClick={() => setPlaying(true)} aria-label={`Play ${selected.sourceTitle} on this page`} className="group relative block h-full w-full overflow-hidden text-left focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#f9d98a]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote video poster, never downloaded or rehosted */}
                  <img src={`https://i.ytimg.com/vi/${selected.id}/hqdefault.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-[1.02] group-hover:opacity-100" loading="lazy" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/20" />
                  <span className="absolute left-4 top-4 border border-white/25 bg-black/65 px-2.5 py-1.5 text-[0.55rem] font-bold uppercase tracking-[0.16em] text-white/90 sm:left-6 sm:top-6">NFL · {highlightsPreview.label}</span>
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid h-16 w-16 place-items-center rounded-full border border-[#f9d98a]/65 bg-[#f9d98a] text-[#101116] shadow-[0_0_45px_rgba(249,217,138,0.20)] transition group-hover:scale-110 sm:h-20 sm:w-20"><PlayIcon className="ml-1 h-8 w-8 sm:h-10 sm:w-10" /></span>
                  </span>
                  <span className="absolute bottom-4 left-4 text-[0.6rem] font-black uppercase tracking-[0.2em] text-[#f9d98a] sm:bottom-6 sm:left-6">Open the replay</span>
                </button>
              )}
            </div>
            <div className="p-5 sm:p-6" aria-live="polite">
              <p className="text-[0.6rem] font-black uppercase tracking-[0.18em] text-[#f9d98a]">{playing ? 'Selected highlight' : 'In the spotlight'} · {selected.category}</p>
              <h3 className="mt-2 text-xl font-black leading-tight text-white sm:text-2xl">{selected.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{selected.caption}</p>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-[0.6rem] text-white/40">
                <span>Official NFL video · {highlightsPreview.label}</span>
                <a href={`https://www.youtube.com/watch?v=${selected.id}`} target="_blank" rel="noopener noreferrer" className="underline decoration-white/20 underline-offset-4 transition hover:text-[#f9d98a]">Watch on YouTube ↗</a>
              </div>
            </div>
          </div>

          <div className="min-w-0 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-black uppercase tracking-[0.16em] text-white/85">Worth the replay</h3>
              <span className="font-mono text-[0.6rem] text-white/35">{String(videos.length).padStart(2, '0')} VIDEOS</span>
            </div>
            <div className="mb-3 mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter highlights">
              {['All plays', 'Catches', 'Player reels'].map((category) => (
                <button key={category} type="button" aria-pressed={filter === category} onClick={() => setFilter(category)} className={`border px-2.5 py-1.5 text-[0.6rem] font-bold transition ${filter === category ? 'border-[#f9d98a]/40 bg-[#f9d98a]/10 text-[#f9d98a]' : 'border-white/10 text-white/40 hover:border-white/25 hover:text-white/75'}`}>{category}</button>
              ))}
            </div>
            <ul className="space-y-2">
              {videos.map((video) => {
                const active = video.id === selected.id;
                return (
                  <li key={video.id}>
                    <button type="button" aria-pressed={active} aria-label={`Select ${video.sourceTitle}`} onClick={() => { setSelectedId(video.id); setPlaying(false); }} className={`group flex w-full items-center gap-3 border p-2.5 text-left transition ${active ? 'border-[#f9d98a]/35 bg-[#f9d98a]/[0.065]' : 'border-transparent hover:border-white/15 hover:bg-white/[0.025]'}`}>
                      <span className="relative aspect-video w-24 shrink-0 overflow-hidden bg-white/5 sm:w-28">
                        {/* eslint-disable-next-line @next/next/no-img-element -- source-hosted video thumbnail */}
                        <img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-75 transition group-hover:opacity-100" />
                        <span className="absolute inset-0 grid place-items-center bg-black/15"><PlayIcon className={`h-6 w-6 ${active ? 'text-[#f9d98a]' : 'text-white'}`} /></span>
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-[0.55rem] font-black uppercase tracking-[0.1em] ${active ? 'text-[#f9d98a]' : 'text-white/35'}`}>{active ? 'Selected' : video.category}</span>
                        <span className="mt-1 block text-xs font-bold leading-snug text-white/85">{video.title}</span>
                        <span className="mt-1 block text-[0.55rem] text-white/35">NFL · 2024 season</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-5 border-t border-white/10 pt-4 text-[0.65rem] leading-relaxed text-white/40">A little film study. A lot of bragging material.</p>
          </div>
        </div>
        <p className="border-t border-white/10 bg-black/20 px-5 py-3 text-[0.6rem] leading-relaxed text-white/40 sm:px-6">Design preview with 2024 archive clips. These NFL samples restrict playback on external sites. The current-week feed isn&rsquo;t connected yet.</p>
      </div>
    </section>
  );
}
