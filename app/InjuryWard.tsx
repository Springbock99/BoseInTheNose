'use client';

import { useEffect, useMemo, useState } from 'react';
import { PlayerAvatar, TeamAvatar } from './LeagueAvatars';
import { rankInjuries, rosterPlayerIds, type InjuryRoster, type InjurySnapshot, type InjuryTeam } from './lib/injuries';

export default function InjuryWard({ teams, rosters, leagueStatus }: {
  teams: InjuryTeam[];
  rosters: InjuryRoster[];
  leagueStatus: 'loading' | 'ready' | 'offline';
}) {
  const [snapshot, setSnapshot] = useState<InjurySnapshot | null>(null);
  const [failed, setFailed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [openRoster, setOpenRoster] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [checkedAt, setCheckedAt] = useState(0);
  const ids = [...new Set(rosters.flatMap(rosterPlayerIds))].sort().join(',');

  useEffect(() => {
    if (!ids) return;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/injuries?${new URLSearchParams({ ids })}`, {
          cache: 'no-store', signal: controller.signal,
        });
        if (!response.ok) throw new Error('Injury report unavailable');
        const data = await response.json() as InjurySnapshot;
        if (!data.players || !data.fetchedAt) throw new Error('Incomplete injury report');
        if (!controller.signal.aborted) {
          setSnapshot(data);
          setCheckedAt(Date.now());
          setFailed(false);
        }
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    }
    void load();
    // The server keeps one daily snapshot, shared by every visitor.
    const interval = window.setInterval(() => void load(), 3_600_000);
    return () => { controller.abort(); window.clearInterval(interval); };
  }, [ids, attempt]);

  const ranked = useMemo(() => rankInjuries(teams, rosters, snapshot?.players ?? {}), [teams, rosters, snapshot]);
  const complete = ranked.length > 0 && ranked.every((team) => !team.incomplete);
  const mostOut = ranked[0]?.out ?? 0;
  const chiefs = complete && mostOut > 0 ? ranked.filter((team) => team.out === mostOut) : [];
  const rows = showAll ? ranked : ranked.slice(0, 3);
  const updated = snapshot ? new Date(snapshot.fetchedAt).toLocaleString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : null;
  const stale = snapshot && checkedAt - new Date(snapshot.fetchedAt).getTime() > 26 * 3_600_000;

  return (
    <section aria-labelledby="injury-ward-title" className="mt-5 max-w-2xl overflow-hidden border border-rose-400/25 bg-[#100d17]/95 shadow-[0_14px_48px_rgba(251,113,133,0.07)] backdrop-blur-sm">
      <div className="h-1 bg-gradient-to-r from-rose-400 via-rose-400/35 to-transparent" />
      <div className="flex items-start justify-between gap-3 p-4">
        <div>
          <h2 id="injury-ward-title" className="text-xs font-black uppercase tracking-[0.18em] text-rose-300">Injury Ward</h2>
          <p className="mt-2 text-lg font-bold leading-snug text-rose-400 sm:text-xl">The league&rsquo;s official excuse leaderboard.</p>
        </div>
        <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-rose-300/20 bg-rose-400/10 text-xl font-black text-rose-300">+</span>
      </div>

      {!snapshot || !teams.length ? (
        <div className="px-4 pb-5 text-sm text-white/55" role="status">
          {failed || leagueStatus === 'offline' ? (
            <>
              <p>The injury report is unavailable. Excuses pending verification.</p>
              {ids && <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-3 text-xs font-bold text-rose-300 underline underline-offset-4">Retry injury report</button>}
            </>
          ) : leagueStatus === 'ready' && !ids ? 'No rostered players to check yet.' : 'Checking the damage…'}
        </div>
      ) : (
        <>
          {chiefs.length > 0 && (
            <div className="relative mx-4 mb-4 overflow-hidden border border-rose-400/35 bg-gradient-to-br from-rose-500/20 via-rose-500/5 to-transparent p-4">
              <p className="text-[0.6rem] font-black uppercase tracking-[0.19em] text-rose-300">{chiefs.length > 1 ? 'Shared custody of the excuses' : 'Your excuses have a spokesperson'}</p>
              <div className="mt-3 flex items-center gap-3">
                <TeamAvatar team={chiefs[0]} className="h-11 w-11 rounded-full" />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-black leading-tight text-white [overflow-wrap:anywhere]">{chiefs.map((team) => team.managerName).join(' & ')}</p>
                  <p className="mt-1 text-[0.6rem] font-black uppercase tracking-[0.12em] text-rose-300">Chief Excuse Officer{chiefs.length > 1 ? 's' : ''}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-4xl font-black tabular-nums text-rose-300">{mostOut}</p>
                  <p className="text-[0.55rem] font-black uppercase tracking-widest text-white/45">Out / IR{chiefs.length > 1 ? ' each' : ''}</p>
                </div>
              </div>
              <p className="mt-3 border-t border-rose-300/15 pt-3 text-xs italic leading-relaxed text-white/60">Drafted a fantasy team. Got a waiting room.</p>
            </div>
          )}
          {complete && ranked.every((team) => team.players.length === 0) && (
            <p className="mx-4 mb-4 text-sm text-emerald-300">Everyone available. No excuses.</p>
          )}
          <div className="flex items-center justify-between gap-2 border-y border-white/10 bg-white/[0.025] px-4 py-2 text-[0.55rem] font-bold uppercase tracking-widest text-white/40">
            <span>Manager</span>
            <span className="flex shrink-0 gap-2 text-center"><span className="w-11">Out / IR</span><span className="w-9">Doubt.</span><span className="w-9">Quest.</span><span className="w-2" /></span>
          </div>
          <ol>
            {rows.map((team, index) => {
              const chief = chiefs.some((entry) => entry.rosterId === team.rosterId);
              const rank = ranked.findIndex((entry) => entry.out === team.out) + 1;
              const open = openRoster === team.rosterId;
              return (
                <li key={team.rosterId} className={`border-b border-white/[0.07] last:border-b-0 ${chief ? 'bg-rose-400/[0.055]' : ''}`}>
                  <button type="button" aria-expanded={open} aria-controls={`injuries-${team.rosterId}`} onClick={() => setOpenRoster(open ? null : team.rosterId)} className="flex w-full items-center gap-2 px-4 py-3 text-left transition hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rose-300">
                    <span className={`w-4 shrink-0 font-mono text-xs ${chief ? 'text-rose-300' : 'text-white/30'}`}>{complete ? rank : index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-xs font-bold ${chief ? 'text-rose-200' : 'text-white/80'}`}>{team.managerName}</p>
                      <p className="mt-0.5 truncate text-[0.6rem] text-white/35">{team.name}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-2 text-center font-mono text-sm font-bold tabular-nums">
                      <span className={`w-11 ${team.out ? 'text-rose-300' : 'text-white/25'}`}>{team.out}{team.incomplete ? '+' : ''}</span>
                      <span className={`w-9 ${team.doubtful ? 'text-orange-300' : 'text-white/25'}`}>{team.doubtful}</span>
                      <span className={`w-9 ${team.questionable ? 'text-amber-200' : 'text-white/25'}`}>{team.questionable}</span>
                      <span aria-hidden="true" className="w-2 text-xs text-white/40">{open ? '−' : '+'}</span>
                    </span>
                  </button>
                  <div id={`injuries-${team.rosterId}`} hidden={!open} className="border-t border-white/[0.06] bg-black/15 px-4 py-2">
                    {team.incomplete && <p className="py-2 text-xs text-amber-200">Some player data is missing. Counts may be incomplete.</p>}
                    {!team.incomplete && !team.players.length && <p className="py-3 text-xs text-white/55">Everyone available. No excuses.</p>}
                    <ul>
                      {team.players.map((player) => (
                        <li key={player.id} className="flex items-center gap-2.5 border-b border-white/[0.05] py-2 last:border-0">
                          <PlayerAvatar playerId={player.id} player={player} className="h-8 w-8" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white/80">{player.name}</p>
                            <p className="mt-0.5 text-[0.6rem] text-white/40">{[player.position, player.team].filter(Boolean).join(' · ')}{player.starting && <span className="text-amber-200"> · In starting lineup</span>}</p>
                          </div>
                          <span className={`shrink-0 border px-1.5 py-1 text-[0.55rem] font-black uppercase tracking-wide ${player.injury === 'IR' || player.injury === 'Out' ? 'border-rose-300/20 bg-rose-400/10 text-rose-300' : 'border-amber-200/20 bg-amber-200/5 text-amber-200'}`}>{player.injury}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
          {ranked.length > 3 && <button type="button" aria-expanded={showAll} onClick={() => setShowAll((value) => !value)} className="w-full border-t border-white/10 py-3 text-[0.6rem] font-black uppercase tracking-widest text-rose-200 transition hover:bg-rose-400/5">{showAll ? 'Show top 3' : `Inspect all ${ranked.length} managers`}</button>}
          <div className="border-t border-white/10 px-4 py-3 text-[0.6rem] leading-relaxed text-white/35">
            <p>Ranked by Out + IR. Includes bench and IR slots. Ties share a rank.</p>
            {!complete && <p className="mt-1 text-amber-200/80">Partial report: some player data is missing. The title is withheld until all rosters are checked.</p>}
            <p className="mt-1">Sleeper · Updated {updated} · Refreshes daily</p>
            {(failed || stale || leagueStatus === 'offline') && <p className="mt-1 text-amber-200/80">Showing the last available report. Current status may have changed.</p>}
          </div>
        </>
      )}
    </section>
  );
}
