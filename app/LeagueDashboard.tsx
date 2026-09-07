'use client';

import { useEffect, useMemo, useState } from 'react';

type SleeperUser = {
  user_id: string;
  display_name?: string;
  metadata?: {
    team_name?: string;
  };
};

type SleeperRoster = {
  owner_id: string;
  roster_id: number;
  settings?: {
    wins?: number;
    losses?: number;
    ties?: number;
    fpts?: number;
    fpts_decimal?: number;
  };
};

type SleeperLeague = {
  name: string;
  season: string;
  total_rosters: number;
};

type SleeperState = {
  week: number;
  season: string;
};

type LeagueResponse = {
  league: SleeperLeague;
  users: SleeperUser[];
  rosters: SleeperRoster[];
  state: SleeperState;
};

type Matchup = {
  roster_id: number;
  matchup_id: number;
  points: number;
};

type TeamRow = {
  name: string;
  record: string;
  points: string;
  trend: string;
  wins: number;
  fpts: number;
};

type Highlight = {
  tag: string;
  title: string;
  meta: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8787';

const fallbackTeams: TeamRow[] = [
  { name: 'Velvet Blitz', record: '7-2', points: '1,184.6', trend: '+48.2', wins: 7, fpts: 1184.6 },
  { name: 'Sunday Static', record: '6-3', points: '1,102.4', trend: '+12.9', wins: 6, fpts: 1102.4 },
  { name: 'Fourth & Fernet', record: '5-4', points: '1,056.8', trend: '-8.1', wins: 5, fpts: 1056.8 },
  { name: 'Red Zone Royals', record: '5-4', points: '1,043.1', trend: '+21.5', wins: 5, fpts: 1043.1 },
];

const fallbackHighlights: Highlight[] = [
  {
    tag: 'Matchup of the Week',
    title: 'Connect Sleeper to surface the closest games automatically',
    meta: 'Waiting for live matchup data',
  },
  {
    tag: 'Waiver Wire',
    title: 'Trending adds and drops will live here next',
    meta: 'Sleeper trends endpoint ready',
  },
  {
    tag: 'Power Shift',
    title: 'Power ranking notes can be generated from league results',
    meta: 'Standings are live now',
  },
];

const navItems = ['Home', 'Highlights'];

function formatRecord(roster: SleeperRoster) {
  const wins = roster.settings?.wins ?? 0;
  const losses = roster.settings?.losses ?? 0;
  const ties = roster.settings?.ties ?? 0;

  return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
}

function formatPoints(roster: SleeperRoster) {
  const whole = roster.settings?.fpts ?? 0;
  const decimal = roster.settings?.fpts_decimal ?? 0;
  return whole + decimal / 100;
}

function getTeamName(roster: SleeperRoster, usersById: Map<string, SleeperUser>) {
  const user = usersById.get(roster.owner_id);
  return user?.metadata?.team_name || user?.display_name || `Roster ${roster.roster_id}`;
}

function buildTeams(data: LeagueResponse): TeamRow[] {
  const usersById = new Map(data.users.map((user) => [user.user_id, user]));

  return data.rosters
    .map((roster) => {
      const fpts = formatPoints(roster);

      return {
        name: getTeamName(roster, usersById),
        record: formatRecord(roster),
        points: fpts.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
        trend: `${roster.settings?.wins ?? 0}W`,
        wins: roster.settings?.wins ?? 0,
        fpts,
      };
    })
    .sort((a, b) => b.wins - a.wins || b.fpts - a.fpts)
    .slice(0, 6);
}

function buildHighlights(data: LeagueResponse, matchups: Matchup[]): Highlight[] {
  const teamsByRoster = new Map(data.rosters.map((roster) => [roster.roster_id, roster]));
  const usersById = new Map(data.users.map((user) => [user.user_id, user]));
  const groupedMatchups = matchups.reduce<Map<number, Matchup[]>>((groups, matchup) => {
    const current = groups.get(matchup.matchup_id) || [];
    groups.set(matchup.matchup_id, [...current, matchup]);
    return groups;
  }, new Map());

  const completedGames = [...groupedMatchups.values()]
    .filter((game) => game.length >= 2)
    .map((game) => {
      const sorted = [...game].sort((a, b) => b.points - a.points);
      return {
        winner: sorted[0],
        runnerUp: sorted[1],
        margin: Math.abs(sorted[0].points - sorted[1].points),
      };
    })
    .sort((a, b) => a.margin - b.margin);

  const closest = completedGames[0];
  const topScore = [...matchups].sort((a, b) => b.points - a.points)[0];
  const leader = buildTeams(data)[0];

  const closestWinnerRoster = closest ? teamsByRoster.get(closest.winner.roster_id) : undefined;
  const closestRunnerRoster = closest ? teamsByRoster.get(closest.runnerUp.roster_id) : undefined;
  const topRoster = topScore ? teamsByRoster.get(topScore.roster_id) : undefined;

  return [
    {
      tag: 'Matchup of the Week',
      title: closest && closestWinnerRoster && closestRunnerRoster
        ? `${getTeamName(closestWinnerRoster, usersById)} edges ${getTeamName(closestRunnerRoster, usersById)}`
        : 'This week’s tightest matchup will appear once scores land',
      meta: closest ? `Margin: ${closest.margin.toFixed(2)} points` : `Week ${data.state.week}`,
    },
    {
      tag: 'Top Score',
      title: topScore && topRoster
        ? `${getTeamName(topRoster, usersById)} leads the week`
        : 'Top weekly score is waiting on live matchup data',
      meta: topScore ? `${topScore.points.toFixed(2)} points` : 'No score posted yet',
    },
    {
      tag: 'Table Leader',
      title: leader ? `${leader.name} sits at the top of ${data.league.name}` : data.league.name,
      meta: leader ? `${leader.record} record | ${leader.points} PF` : `${data.league.total_rosters} rosters`,
    },
  ];
}

export default function LeagueDashboard() {
  const [leagueData, setLeagueData] = useState<LeagueResponse | null>(null);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'offline'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function loadLeague() {
      try {
        const leagueResponse = await fetch(`${apiBaseUrl}/api/league`);
        if (!leagueResponse.ok) {
          throw new Error('League request failed');
        }

        const data = (await leagueResponse.json()) as LeagueResponse;
        const week = data.state?.week || 1;
        const matchupsResponse = await fetch(`${apiBaseUrl}/api/league/matchups/${week}`);
        const matchupData = matchupsResponse.ok ? await matchupsResponse.json() : { matchups: [] };

        if (!cancelled) {
          setLeagueData(data);
          setMatchups(matchupData.matchups || []);
          setStatus('ready');
        }
      } catch {
        if (!cancelled) {
          setStatus('offline');
        }
      }
    }

    loadLeague();

    return () => {
      cancelled = true;
    };
  }, []);

  const teams = useMemo(() => (leagueData ? buildTeams(leagueData) : fallbackTeams), [leagueData]);
  const highlights = useMemo(
    () => (leagueData ? buildHighlights(leagueData, matchups) : fallbackHighlights),
    [leagueData, matchups],
  );

  const leagueName = leagueData?.league.name || 'Bose In The Nose';
  const season = leagueData?.league.season || '2026';
  const totalManagers = leagueData?.league.total_rosters || 14;
  const currentWeek = leagueData?.state.week || 1;

  return (
    <main className="min-h-screen bg-[#050608] text-[#f7f2e8]">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(196,35,35,0.28),transparent_32%),linear-gradient(180deg,#111318_0%,#050608_54%,#020203_100%)]" />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050608]/86 backdrop-blur-xl">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#home" className="flex items-center gap-3" aria-label="Bose In The Nose home">
            <span className="grid h-11 w-11 place-items-center border border-[#d6a957]/70 bg-[#101217] text-lg font-black text-[#d6a957]">
              BN
            </span>
            <span>
              <span className="block text-sm font-semibold uppercase tracking-[0.24em] text-[#d6a957]">
                Fantasy League
              </span>
              <span className="block text-lg font-black leading-none">{leagueName}</span>
            </span>
          </a>
          <div className="flex items-center gap-1 border border-white/10 bg-white/[0.04] p-1">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="px-3 py-2 text-sm font-semibold text-white/72 transition hover:bg-white/10 hover:text-white sm:px-5"
              >
                {item}
              </a>
            ))}
          </div>
        </nav>
      </header>

      <section id="home" className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="max-w-3xl">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.32em] text-[#d6a957]">
            {season} league command center
          </p>
          <h1 className="text-5xl font-black leading-[0.96] tracking-normal text-white sm:text-7xl lg:text-8xl">
            Every week gets its own legend.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/70">
            {status === 'ready'
              ? `${leagueName} is now connected to Sleeper. Standings, team totals, and weekly highlights are being pulled through your local backend.`
              : 'A dark-mode clubhouse for standings, weekly stories, rivalries, and Sleeper-powered league data.'}
          </p>
          <div className="mt-9 grid max-w-2xl grid-cols-3 border border-white/10 bg-white/[0.04]">
            {[
              [String(totalManagers).padStart(2, '0'), 'Managers'],
              [String(currentWeek).padStart(2, '0'), 'NFL week'],
              [status === 'ready' ? 'Live' : status === 'loading' ? 'Sync' : 'Local', 'Sleeper data'],
            ].map(([value, label]) => (
              <div key={label} className="border-r border-white/10 p-5 last:border-r-0">
                <div className="text-3xl font-black text-white">{value}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/45">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <aside className="border border-white/10 bg-[#0d1015]/92 p-5 shadow-2xl shadow-black/40">
          <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d6a957]">Standings</p>
              <h2 className="mt-1 text-2xl font-black">Top Table</h2>
            </div>
            <span className="border border-[#d6a957]/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#d6a957]">
              {status === 'ready' ? 'Sleeper live' : status === 'loading' ? 'Syncing' : 'Backend off'}
            </span>
          </div>
          <div className="space-y-3">
            {teams.map((team, index) => (
              <div key={team.name} className="grid grid-cols-[36px_1fr_auto] items-center gap-4 border border-white/10 bg-white/[0.035] p-4">
                <span className="text-lg font-black text-white/38">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="font-bold text-white">{team.name}</h3>
                  <p className="text-sm text-white/48">{team.record} | {team.points} PF</p>
                </div>
                <span className="text-sm font-bold text-emerald-300">{team.trend}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section id="highlights" className="border-t border-white/10 bg-[#090b0f] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.32em] text-[#d6a957]">Highlights</p>
              <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">Weekly pulse</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/58">
              Live weekly cards from Sleeper: closest matchup, top score, and current table leader.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {highlights.map((item) => (
              <article key={`${item.tag}-${item.title}`} className="min-h-64 border border-white/10 bg-[#11141a] p-6 transition hover:border-[#d6a957]/60 hover:bg-[#151922]">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d6a957]">{item.tag}</p>
                <h3 className="mt-8 text-2xl font-black leading-tight text-white">{item.title}</h3>
                <p className="mt-6 border-t border-white/10 pt-4 text-sm font-semibold text-white/50">{item.meta}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
