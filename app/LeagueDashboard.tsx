'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type SleeperUser = {
  user_id: string;
  avatar?: string | null;
  display_name?: string;
  metadata?: {
    avatar?: string;
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
  avatarUrl?: string;
  wins: number;
  fpts: number;
};

type Highlight = {
  tag: string;
  title: string;
  meta: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8787';
const logoImageUrl = '/nfl-fantasy-logo.png';

const fallbackTeams: TeamRow[] = [
  { name: 'Velvet Blitz', record: '7-2', points: '1,184.6', trend: '+48.2', wins: 7, fpts: 1184.6 },
  { name: 'Sunday Static', record: '6-3', points: '1,102.4', trend: '+12.9', wins: 6, fpts: 1102.4 },
  { name: 'Fourth & Fernet', record: '5-4', points: '1,056.8', trend: '-8.1', wins: 5, fpts: 1056.8 },
  { name: 'Red Zone Royals', record: '5-4', points: '1,043.1', trend: '+21.5', wins: 5, fpts: 1043.1 },
  { name: 'Goal Line Gold', record: '4-5', points: '1,008.3', trend: '+4.0', wins: 4, fpts: 1008.3 },
  { name: 'Deep Ball Social', record: '4-5', points: '998.1', trend: '-2.7', wins: 4, fpts: 998.1 },
  { name: 'Flex Appeal', record: '3-6', points: '962.2', trend: '+9.6', wins: 3, fpts: 962.2 },
  { name: 'Two Minute Drill', record: '2-7', points: '921.9', trend: '-14.2', wins: 2, fpts: 921.9 },
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
const refreshIntervalMs = 60_000;
const logoStyles = [
  {
    name: 'Gold Aura',
    detail: 'champion glow',
    shellClass: 'h-20 w-20 sm:h-24 sm:w-24',
    glowClass: 'inset-0 bg-[radial-gradient(circle_at_50%_52%,rgba(255,190,89,0.58),rgba(244,197,106,0.24)_40%,transparent_72%)] blur-md',
    imageClass: 'h-16 w-16 sm:h-20 sm:w-20',
  },
  {
    name: 'Warm Sweep',
    detail: 'gold from left',
    shellClass: 'h-20 w-20 sm:h-24 sm:w-24',
    glowClass: '-inset-2 bg-[linear-gradient(115deg,rgba(255,190,89,0.52),rgba(98,223,255,0.16)_46%,transparent_74%)] blur-lg',
    imageClass: 'h-16 w-16 sm:h-20 sm:w-20',
  },
  {
    name: 'Trophy Wake',
    detail: 'scoreboard trail',
    shellClass: 'h-20 w-20 sm:h-24 sm:w-24',
    glowClass: '-inset-3 bg-[radial-gradient(circle_at_48%_50%,rgba(255,190,89,0.38),transparent_42%),radial-gradient(circle_at_12%_55%,rgba(167,139,250,0.18),transparent_52%)] blur-xl',
    imageClass: 'h-16 w-16 sm:h-20 sm:w-20',
  },
];
const selectedLogoStyle = logoStyles[0];
const backgroundStyle = {
  imageUrl: '/stadium-background.png',
  imageClass: 'opacity-[0.52] blur-[0.5px] saturate-[1.02] contrast-[0.92]',
  washClass: 'bg-[linear-gradient(90deg,rgba(2,3,5,0.84)_0%,rgba(2,3,5,0.42)_50%,rgba(2,3,5,0.78)_100%),linear-gradient(180deg,rgba(2,3,5,0.34)_0%,rgba(2,3,5,0.72)_76%,#020305_100%)]',
  glowClass: 'bg-[radial-gradient(circle_at_50%_4%,rgba(98,223,255,0.24),transparent_36%),radial-gradient(circle_at_16%_22%,rgba(167,139,250,0.13),transparent_22%)]',
};
const scoreboardStyles = [
  {
    name: 'Tunnel Classic',
    detail: 'wide rows, loud ranks',
    rowClass: 'grid-cols-[3rem_3.25rem_1fr_auto] min-h-16 px-3 py-3',
    rankClass: 'h-10 w-10',
    avatarClass: 'h-11 w-11',
    titleClass: 'text-base',
  },
  {
    name: 'Locker Room',
    detail: 'denser board, more stat feel',
    rowClass: 'grid-cols-[2.5rem_3rem_1fr_auto] min-h-14 px-3 py-2',
    rankClass: 'h-8 w-8',
    avatarClass: 'h-10 w-10',
    titleClass: 'text-sm',
  },
  {
    name: 'Neon Stack',
    detail: 'avatar-forward cards',
    rowClass: 'grid-cols-[3.25rem_1fr_auto] min-h-18 px-4 py-3',
    rankClass: 'hidden',
    avatarClass: 'h-12 w-12 rounded-full',
    titleClass: 'text-base',
  },
];
const selectedScoreboardStyle = scoreboardStyles[2];
const defaultSleeperAvatarIds = new Set([
  '578c6b253dd7b4bab45382e1af102204',
  '7572250c2fb084c434fed0e82229e183',
  'd55d1f7075eda01948318de4af616075',
]);

function LogoImage({ className }: { className: string }) {
  return (
    <span
      className={`block shrink-0 bg-contain bg-center bg-no-repeat mix-blend-screen drop-shadow-[0_0_18px_rgba(98,223,255,0.18)] ${className}`}
      style={{ backgroundImage: `url(${logoImageUrl})` }}
      aria-label="Bouse In The Nose logo"
    />
  );
}

function LogoLockup({
  style,
  leagueName,
  compact = false,
}: {
  style: (typeof logoStyles)[number];
  leagueName: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${compact ? '' : 'min-w-0'}`}>
      <span className={`relative grid shrink-0 place-items-center ${style.shellClass}`}>
        <span className={`pointer-events-none absolute ${style.glowClass}`} />
        <LogoImage className={`relative ${compact ? 'h-12 w-12' : style.imageClass}`} />
      </span>
      <span className="min-w-0">
        {!compact && <span className="block truncate text-lg font-black leading-none">{leagueName}</span>}
        {compact && (
          <>
            <span className="block text-sm font-black leading-none text-white">{style.name}</span>
            <span className="mt-1 block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/42">
              {style.detail}
            </span>
          </>
        )}
      </span>
    </div>
  );
}

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

function getAvatarUrl(roster: SleeperRoster, usersById: Map<string, SleeperUser>) {
  const user = usersById.get(roster.owner_id);
  if (user?.metadata?.avatar) {
    return user.metadata.avatar;
  }

  const avatar = user?.avatar;
  return avatar && !defaultSleeperAvatarIds.has(avatar)
    ? `https://sleepercdn.com/avatars/thumbs/${avatar}`
    : undefined;
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
        avatarUrl: getAvatarUrl(roster, usersById),
        wins: roster.settings?.wins ?? 0,
        fpts,
      };
    })
    .sort((a, b) => b.wins - a.wins || b.fpts - a.fpts);
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

function TeamAvatar({ team, className }: { team: TeamRow; className: string }) {
  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden border border-[#62dfff]/20 bg-[#061826] bg-cover bg-center shadow-[0_0_22px_rgba(98,223,255,0.10)] ${className}`}
      style={team.avatarUrl ? { backgroundImage: `url(${team.avatarUrl})` } : undefined}
      aria-label={`${team.name} avatar`}
      data-avatar-status={team.avatarUrl ? 'custom' : 'placeholder'}
    >
      {!team.avatarUrl && (
        <>
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(98,223,255,0.34),transparent_44%),linear-gradient(145deg,rgba(167,139,250,0.20),rgba(98,223,255,0.08))]" />
          <span className="relative grid h-[52%] w-[52%] place-items-center rounded-full border border-[#62dfff]/25 bg-black/22">
            <span className="absolute top-[24%] h-[26%] w-[26%] rounded-full bg-[#9beeff]" />
            <span className="absolute bottom-[20%] h-[28%] w-[54%] rounded-t-full bg-[#9beeff]" />
          </span>
        </>
      )}
    </span>
  );
}

function ScoreboardMockup({
  teams,
  status,
  lastUpdatedLabel,
  totalManagers,
  style,
  isRefreshing,
  onRefresh,
}: {
  teams: TeamRow[];
  status: 'loading' | 'ready' | 'offline';
  lastUpdatedLabel: string;
  totalManagers: number;
  style: (typeof scoreboardStyles)[number];
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <article className="relative overflow-hidden border border-[#a78bfa]/22 bg-[#0d0b16]/92 p-4 shadow-[0_28px_90px_rgba(167,139,250,0.14)] before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(118deg,rgba(167,139,250,0.24),transparent_28%),radial-gradient(circle_at_92%_8%,rgba(98,223,255,0.18),transparent_24%),radial-gradient(circle_at_25%_95%,rgba(255,66,92,0.16),transparent_30%)] sm:p-5">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#a78bfa] via-[#62dfff] to-transparent" />
      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#62dfff]">Standings</p>
            <h2 className="mt-1 text-2xl font-black">Full Standings</h2>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/38">
              {teams.length} of {totalManagers} teams | Updated {lastUpdatedLabel}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="border border-[#a78bfa]/45 bg-[#a78bfa]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#c4b5fd]">
              {status === 'ready' ? 'Sleeper live' : status === 'loading' ? 'Syncing' : 'Backend off'}
            </span>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white/72 transition hover:border-[#62dfff]/50 hover:text-[#62dfff] disabled:cursor-wait disabled:opacity-50"
            >
              {isRefreshing ? 'Refreshing' : 'Refresh'}
            </button>
          </div>
        </div>
        <div className="mb-2 grid grid-cols-[3.25rem_1fr_auto] gap-3 px-4 text-[0.65rem] font-black uppercase tracking-[0.16em] text-white/34">
          <span>No.</span>
          <span>Team</span>
          <span className="text-right">Wins</span>
        </div>
        <div className="scoreboard-scrollbar max-h-[min(58rem,calc(100vh-15rem))] space-y-2.5 overflow-y-auto pr-1">
          {teams.map((team, teamIndex) => (
            <div
              key={`${style.name}-${team.name}`}
              className={`grid items-center gap-3 border border-white/10 bg-black/22 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm transition hover:border-[#62dfff]/35 hover:bg-white/[0.075] ${style.rowClass}`}
            >
              {style.rankClass !== 'hidden' && (
                <span className={`grid place-items-center border border-[#a78bfa]/25 bg-[#a78bfa]/10 text-sm font-black text-[#c4b5fd] ${style.rankClass}`}>
                  {String(teamIndex + 1).padStart(2, '0')}
                </span>
              )}
              <TeamAvatar team={team} className={style.avatarClass} />
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  {style.rankClass === 'hidden' && (
                    <span className="text-xs font-black text-white/30">{String(teamIndex + 1).padStart(2, '0')}</span>
                  )}
                  <h3 className={`truncate font-bold text-white ${style.titleClass}`}>{team.name}</h3>
                </div>
                <p className="mt-1 text-xs font-semibold text-white/46">{team.record} | {team.points} PF</p>
              </div>
              <span className="text-sm font-black text-[#62dfff]">{team.trend}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 border-t border-white/10 pt-3 text-xs font-semibold text-white/40">
          Pulled live from Sleeper. Once games start logging scores, records and PF will update here automatically.
        </p>
      </div>
    </article>
  );
}

export default function LeagueDashboard() {
  const [leagueData, setLeagueData] = useState<LeagueResponse | null>(null);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'offline'>('loading');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLeague = useCallback(async (shouldUpdate = () => true) => {
    setIsRefreshing(true);

    try {
      const leagueResponse = await fetch(`${apiBaseUrl}/api/league`, { cache: 'no-store' });
      if (!leagueResponse.ok) {
        throw new Error('League request failed');
      }

      const data = (await leagueResponse.json()) as LeagueResponse;
      const week = data.state?.week || 1;
      const matchupsResponse = await fetch(`${apiBaseUrl}/api/league/matchups/${week}`, { cache: 'no-store' });
      const matchupData = matchupsResponse.ok ? await matchupsResponse.json() : { matchups: [] };

      if (!shouldUpdate()) {
        return;
      }

      setLeagueData(data);
      setMatchups(matchupData.matchups || []);
      setLastUpdated(new Date());
      setStatus('ready');
    } catch {
      if (!shouldUpdate()) {
        return;
      }

      setStatus('offline');
    } finally {
      if (shouldUpdate()) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const shouldUpdate = () => mounted;

    void Promise.resolve().then(() => loadLeague(shouldUpdate));
    const interval = window.setInterval(() => loadLeague(shouldUpdate), refreshIntervalMs);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [loadLeague]);

  const teams = useMemo(() => (leagueData ? buildTeams(leagueData) : fallbackTeams), [leagueData]);
  const highlights = useMemo(
    () => (leagueData ? buildHighlights(leagueData, matchups) : fallbackHighlights),
    [leagueData, matchups],
  );

  const leagueName = leagueData?.league.name || 'Bose In The Nose';
  const season = leagueData?.league.season || '2026';
  const totalManagers = leagueData?.league.total_rosters || 14;
  const currentWeek = leagueData?.state.week || 1;
  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Not yet';

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#050608] text-[#f5f8fb]">
      <div
        className={`pointer-events-none fixed inset-0 z-0 bg-cover bg-center transition duration-500 ${backgroundStyle.imageClass}`}
        style={{ backgroundImage: `url('${backgroundStyle.imageUrl}')` }}
      />
      <div className={`pointer-events-none fixed inset-0 z-[1] transition duration-500 ${backgroundStyle.washClass}`} />
      <div className={`pointer-events-none fixed inset-0 z-[2] transition duration-500 ${backgroundStyle.glowClass}`} />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050608]/86 backdrop-blur-xl">
        <nav className="mx-auto flex min-h-20 max-w-7xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <a href="#home" className="flex items-center gap-3" aria-label="Bose In The Nose home">
            <LogoLockup style={selectedLogoStyle} leagueName={leagueName} />
          </a>
          <div className="flex items-center gap-1 border border-white/10 bg-white/[0.04] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="px-3 py-2 text-sm font-semibold text-white/72 transition hover:bg-[#62dfff]/10 hover:text-[#62dfff] sm:px-5"
              >
                {item}
              </a>
            ))}
          </div>
        </nav>
      </header>

      <section id="home" className="relative z-10 mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-start gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:py-28">
        <div className="max-w-3xl lg:pt-28">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.32em] text-[#62dfff]">
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
          <div className="mt-9 grid max-w-2xl grid-cols-3 border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
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
          <div className="mt-7 max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-[#62dfff]">Logo mockups</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {logoStyles.map((style) => (
                <div
                  key={style.name}
                  className="relative overflow-visible p-1"
                >
                  <LogoLockup style={style} leagueName={leagueName} compact />
                </div>
              ))}
            </div>
          </div>
        </div>

        <ScoreboardMockup
          teams={teams}
          status={status}
          lastUpdatedLabel={lastUpdatedLabel}
          totalManagers={totalManagers}
          style={selectedScoreboardStyle}
          isRefreshing={isRefreshing}
          onRefresh={() => loadLeague()}
        />
      </section>

      <section id="highlights" className="relative z-10 border-t border-white/10 bg-[#090b0f]/94 px-5 py-20 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.32em] text-[#62dfff]">Highlights</p>
              <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">Weekly pulse</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/58">
              Live weekly cards from Sleeper: closest matchup, top score, and current table leader.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {highlights.map((item) => (
              <article key={`${item.tag}-${item.title}`} className="min-h-64 border border-white/10 bg-[#11141a] p-6 transition hover:border-[#62dfff]/60 hover:bg-[#151922] hover:shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#62dfff]">{item.tag}</p>
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
