'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageBackground from './PageBackground';
import { withViewTransition } from './lib/viewTransition';
import SponsorStrip from './SponsorStrip';

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
  /** Slot order for a starting lineup, e.g. QB, RB, RB, ... plus BN entries. */
  roster_positions?: string[];
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
  players?: string[];
  starters?: string[];
  /** Parallel to `starters`: index n is what starter n scored. */
  starters_points?: number[];
  players_points?: Record<string, number>;
};

type TeamRow = {
  name: string;
  managerName: string;
  rosterId: number;
  record: string;
  points: string;
  trend: string;
  avatarUrl?: string;
  wins: number;
  fpts: number;
};

type RecapCard = {
  label: string;
  team: string;
  value: string;
  meta: string;
  /** Bench Pain puts the player in `team`, so the manager needs its own field. */
  owner?: string;
  /** Bench Pain again: the id behind the name, for the headshot. */
  playerId?: string;
  /** The team behind the number, for cards that show a crest. */
  teamRef?: TeamRow;
};

type RecordCard = {
  label: string;
  value: string;
  team: string;
  meta: string;
};

type PlayerMeta = {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  position?: string;
  team?: string;
};

type PlayerDirectory = Record<string, PlayerMeta>;

type HeroStat = {
  label: string;
  value: string;
  subject: string;
  /** Optional second line: who the subject belongs to, or what the number means. */
  detail?: string;
  /** Number of wins to mark with a tick, for the streak card. */
  checks?: number;
  /** Shown beside the label — the streak holder gets their crest on the card. */
  avatarTeam?: TeamRow;
  /** Same slot, for a player: Bench Pain shows who was left out. */
  avatarPlayerId?: string;
  /** Set when the card opens a panel; makes it a button rather than a figure. */
  onClick?: () => void;
  expanded?: boolean;
};

type WeekEntry = {
  rosterId: number;
  points: number;
  opponentId: number;
  opponentPoints: number;
};

type ResultsResponse = {
  throughWeek: number;
  weeks: { week: number; entries: WeekEntry[] }[];
};

type StreakGame = {
  week: number;
  opponent: string;
  points: number;
  opponentPoints: number;
};

type StreakDetail = {
  team: TeamRow;
  length: number;
  games: StreakGame[];
  next: { week: number; opponent: string } | null;
};

type LineupSlot = {
  slot: string;
  playerId: string;
  points: number;
};

type MatchupSide = {
  team: TeamRow;
  points: number;
  lineup: LineupSlot[];
};

type ClosestMatchup = {
  home: MatchupSide;
  away: MatchupSide;
};

// The API now lives in this same app under /api, so requests are same-origin
// and need no base URL or CORS.
const apiBaseUrl = '';

const fallbackTeams: TeamRow[] = [
  { name: 'Velvet Blitz', managerName: 'Velvet Blitz', rosterId: 1, record: '7-2', points: '1,184.6', trend: '+48.2', wins: 7, fpts: 1184.6 },
  { name: 'Sunday Static', managerName: 'Sunday Static', rosterId: 2, record: '6-3', points: '1,102.4', trend: '+12.9', wins: 6, fpts: 1102.4 },
  { name: 'Fourth & Fernet', managerName: 'Fourth & Fernet', rosterId: 3, record: '5-4', points: '1,056.8', trend: '-8.1', wins: 5, fpts: 1056.8 },
  { name: 'Red Zone Royals', managerName: 'Red Zone Royals', rosterId: 4, record: '5-4', points: '1,043.1', trend: '+21.5', wins: 5, fpts: 1043.1 },
  { name: 'Goal Line Gold', managerName: 'Goal Line Gold', rosterId: 5, record: '4-5', points: '1,008.3', trend: '+4.0', wins: 4, fpts: 1008.3 },
  { name: 'Deep Ball Social', managerName: 'Deep Ball Social', rosterId: 6, record: '4-5', points: '998.1', trend: '-2.7', wins: 4, fpts: 998.1 },
  { name: 'Flex Appeal', managerName: 'Flex Appeal', rosterId: 7, record: '3-6', points: '962.2', trend: '+9.6', wins: 3, fpts: 962.2 },
  { name: 'Two Minute Drill', managerName: 'Two Minute Drill', rosterId: 8, record: '2-7', points: '921.9', trend: '-14.2', wins: 2, fpts: 921.9 },
];


const fallbackRecapCards: RecapCard[] = [
  { label: 'High Score', team: 'Bier Football Fame', value: '148.72', meta: '+22.4 over league avg' },
  { label: 'Closest Win', team: 'Bouse House', value: '0.86', meta: 'won by less than a point' },
  { label: 'Bench Pain', team: 'Nordic Blitz', value: '38.10', meta: 'points left sitting', owner: 'Nordic Blitz' },
  { label: 'Cold Snap', team: 'Goal Line Gold', value: '71.44', meta: 'lowest weekly total' },
];

const fallbackRecords: RecordCard[] = [
  { label: 'Highest Week', value: '184.92', team: 'Vikings Valhalla', meta: 'Week 11' },
  { label: 'Biggest Blowout', value: '+76.38', team: 'Bier Football Fame', meta: '2025 semis' },
  { label: 'Worst Beat', value: '0.12', team: 'Touchdown Taste', meta: 'lost on Monday' },
  { label: 'Longest Streak', value: '8W', team: 'Bouse House', meta: 'regular season' },
];

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'Rules', href: '/rules' },
  { label: 'Bouseathlon', href: '/bouseathlon' },
  { label: 'Sponsors', href: '/sponsors' },
];
const refreshIntervalMs = 60_000;
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

function splitLeagueName(name: string) {
  return name.replace(/([a-z])([A-Z])/g, '$1 $2');
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

function getManagerName(roster: SleeperRoster, usersById: Map<string, SleeperUser>) {
  const user = usersById.get(roster.owner_id);
  return user?.display_name || user?.metadata?.team_name || `Roster ${roster.roster_id}`;
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
        managerName: getManagerName(roster, usersById),
        rosterId: roster.roster_id,
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

function formatPlayerName(playerId: string, playerDirectory: PlayerDirectory | null) {
  const player = playerDirectory?.[playerId];
  if (player) {
    return (
      player.full_name ||
      [player.first_name, player.last_name].filter(Boolean).join(' ') ||
      `Player ${playerId}`
    );
  }

  // Only reached before the directory lands. Team defences are keyed by
  // abbreviation, where "NE defense" reads better than "Player NE".
  return playerId.length <= 3 ? `${playerId} defense` : `Player ${playerId}`;
}

// A week is decided once the league has moved past it. Points alone are not
// enough: mid-week, a team leading 5.30-0.00 has not won anything, and reading
// that as a win both inflates the streak and hides the fixture still to play.
function isDecided(week: number, throughWeek: number, entry: WeekEntry) {
  return week < throughWeek && (entry.points > 0 || entry.opponentPoints > 0);
}

// The current run of consecutive wins, counted back from the latest decided
// week. This is what "streak" means — the old card showed total wins, so a team
// that won in weeks 1 and 7 and lost in between still read as a streak.
function buildStreak(results: ResultsResponse | null, teams: TeamRow[]): StreakDetail | null {
  if (!results || teams.length === 0) return null;

  const teamsByRoster = new Map(teams.map((team) => [team.rosterId, team]));
  const nameOf = (rosterId: number) => teamsByRoster.get(rosterId)?.name || `Roster ${rosterId}`;

  let best: StreakDetail | null = null;

  for (const team of teams) {
    const played = results.weeks
      .map((week) => ({ week: week.week, entry: week.entries.find((e) => e.rosterId === team.rosterId) }))
      .filter((row): row is { week: number; entry: WeekEntry } => Boolean(row.entry));

    const decided = played.filter((row) => isDecided(row.week, results.throughWeek, row.entry));
    const upcoming = played.find((row) => !isDecided(row.week, results.throughWeek, row.entry));

    const run: StreakGame[] = [];
    for (const row of [...decided].reverse()) {
      if (row.entry.points <= row.entry.opponentPoints) break;
      run.unshift({
        week: row.week,
        opponent: nameOf(row.entry.opponentId),
        points: row.entry.points,
        opponentPoints: row.entry.opponentPoints,
      });
    }

    const detail: StreakDetail = {
      team,
      length: run.length,
      games: run,
      next: upcoming ? { week: upcoming.week, opponent: nameOf(upcoming.entry.opponentId) } : null,
    };

    // Ties on streak length go to the team with more points, so the card is
    // stable rather than flipping on roster order.
    if (!best || detail.length > best.length || (detail.length === best.length && team.fpts > best.team.fpts)) {
      best = detail;
    }
  }

  return best && best.length > 0 ? best : null;
}

const SLOT_LABELS: Record<string, string> = {
  WRRB_FLEX: 'FLEX',
  REC_FLEX: 'FLEX',
  FLEX: 'FLEX',
  SUPER_FLEX: 'SFLEX',
  DEF: 'DEF',
};

// Starters arrive as a bare array whose position carries the meaning: index 0
// is the first roster_positions entry, and bench slots never appear. Pairing
// the two gives each player its slot label.
function buildLineup(matchup: Matchup, rosterPositions: string[]): LineupSlot[] {
  const startingSlots = rosterPositions.filter((slot) => slot !== 'BN');
  return (matchup.starters || []).map((playerId, index) => ({
    slot: SLOT_LABELS[startingSlots[index]] || startingSlots[index] || '-',
    playerId,
    points: matchup.starters_points?.[index] ?? matchup.players_points?.[playerId] ?? 0,
  }));
}

// The tightest game of the week. Everything else the old highlight feed
// carried (top score, table leader) was already on screen elsewhere.
function buildClosestMatchup(
  matchups: Matchup[],
  teams: TeamRow[],
  rosterPositions: string[],
): ClosestMatchup | null {
  const teamsByRoster = new Map(teams.map((team) => [team.rosterId, team]));
  const groupedMatchups = matchups.reduce<Map<number, Matchup[]>>((groups, matchup) => {
    const current = groups.get(matchup.matchup_id) || [];
    groups.set(matchup.matchup_id, [...current, matchup]);
    return groups;
  }, new Map());

  const closest = [...groupedMatchups.values()]
    // A fixture both teams have yet to play sits at a margin of 0.00 and would
    // otherwise win "closest game" every time before kickoff.
    .filter((game) => game.length >= 2 && game.some((side) => side.points > 0))
    .map((game) => {
      const sorted = [...game].sort((a, b) => b.points - a.points);
      return { winner: sorted[0], runnerUp: sorted[1], margin: Math.abs(sorted[0].points - sorted[1].points) };
    })
    .sort((a, b) => a.margin - b.margin)[0];

  if (!closest) return null;

  const homeTeam = teamsByRoster.get(closest.winner.roster_id);
  const awayTeam = teamsByRoster.get(closest.runnerUp.roster_id);
  if (!homeTeam || !awayTeam) return null;

  // The margin picks which game is closest; it is deliberately not displayed,
  // since a lone number told you nothing about who was ahead.
  return {
    home: {
      team: homeTeam,
      points: closest.winner.points,
      lineup: buildLineup(closest.winner, rosterPositions),
    },
    away: {
      team: awayTeam,
      points: closest.runnerUp.points,
      lineup: buildLineup(closest.runnerUp, rosterPositions),
    },
  };
}

function buildRecapCards(
  teams: TeamRow[],
  matchups: Matchup[],
  currentWeek: number,
  playerDirectory: PlayerDirectory | null,
  isLiveLeague: boolean,
): RecapCard[] {
  const scoredMatchups = matchups.filter((matchup) => matchup.points > 0);
  const highScore = [...scoredMatchups].sort((a, b) => b.points - a.points)[0];
  const teamsByRoster = new Map(teams.map((team) => [team.rosterId, team]));
  const highScoreTeam = highScore ? teamsByRoster.get(highScore.roster_id) : teams[0];
  const lowTeam = [...teams].sort((a, b) => a.fpts - b.fpts)[0];
  const benchPain = matchups
    .flatMap((matchup) => {
      const starters = new Set(matchup.starters || []);
      return (matchup.players || [])
        .filter((playerId) => !starters.has(playerId))
        .map((playerId) => ({
          playerId,
          points: matchup.players_points?.[playerId] || 0,
          team: teamsByRoster.get(matchup.roster_id),
        }));
    })
    .sort((a, b) => b.points - a.points)[0];

  if (!isLiveLeague) {
    return fallbackRecapCards;
  }

  return [
    {
      label: 'High Score',
      team: highScoreTeam?.name || 'Waiting room',
      value: highScore ? highScore.points.toFixed(2) : highScoreTeam?.points || '0.00',
      meta: `Week ${currentWeek} top number`,
      teamRef: highScoreTeam,
    },
    {
      label: 'Table Boss',
      team: teams[0]?.name || 'Unclaimed',
      value: teams[0]?.record || '0-0',
      meta: `${teams[0]?.points || '0.0'} PF on the board`,
    },
    {
      label: 'Bench Pain',
      team: benchPain?.points ? formatPlayerName(benchPain.playerId, playerDirectory) : 'Waiting on player scores',
      value: benchPain?.points ? benchPain.points.toFixed(2) : '0.00',
      meta: benchPain?.points && benchPain.team ? `${benchPain.team.name} left him sitting` : 'best bench player appears live',
      owner: benchPain?.points ? benchPain.team?.managerName || benchPain.team?.name : undefined,
      playerId: benchPain?.points ? benchPain.playerId : undefined,
    },
    {
      label: 'Cold Snap',
      team: lowTeam?.name || 'Waiting room',
      value: lowTeam?.points || '0.0',
      meta: 'lowest PF in the standings',
    },
  ];
}

function buildRecordCards(teams: TeamRow[], currentWeek: number, isLiveLeague: boolean): RecordCard[] {
  const leader = teams[0];
  const mostPoints = [...teams].sort((a, b) => b.fpts - a.fpts)[0];
  const lowTeam = [...teams].sort((a, b) => a.fpts - b.fpts)[0];

  if (!isLiveLeague || !leader) {
    return fallbackRecords;
  }

  return [
    { label: 'Highest Week', value: mostPoints.points, team: mostPoints.name, meta: `Week ${currentWeek}` },
    { label: 'Best Record', value: leader.record, team: leader.name, meta: 'current season' },
    { label: 'Most PF', value: mostPoints.points, team: mostPoints.name, meta: 'points for' },
    { label: 'Longest Streak', value: `${leader.wins}W`, team: leader.managerName, meta: leader.name },
    { label: 'Coldest Start', value: lowTeam.points, team: lowTeam.name, meta: 'needs a spark' },
  ];
}

// Headshots come straight from Sleeper's CDN, which needs no key. A player
// without one answers 403 rather than serving a placeholder, so every image
// carries its own fallback. Team defences use the club logo instead, since
// they are keyed by abbreviation and have no headshot at all.
function PlayerAvatar({
  playerId,
  player,
  className,
}: {
  playerId: string;
  player?: PlayerMeta;
  className: string;
}) {
  const [failed, setFailed] = useState(false);
  const isDefence = playerId.length <= 3 || player?.position === 'DEF';
  const source = isDefence
    ? `https://sleepercdn.com/images/team_logos/nfl/${playerId.toLowerCase()}.png`
    : `https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`;

  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-[#111520] ${className}`}
    >
      {failed ? (
        <span className="text-[0.55rem] font-black uppercase tracking-[0.06em] text-white/38">
          {player?.position || '—'}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- remote CDN image, no loader needed
        <img
          src={source}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className={`h-full w-full ${isDefence ? 'object-contain p-1' : 'object-cover'}`}
        />
      )}
    </span>
  );
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
  openRosterId,
  onToggleRoster,
  lineupFor,
  playerDirectory,
}: {
  teams: TeamRow[];
  status: 'loading' | 'ready' | 'offline';
  lastUpdatedLabel: string;
  totalManagers: number;
  style: (typeof scoreboardStyles)[number];
  isRefreshing: boolean;
  onRefresh: () => void;
  openRosterId: number | null;
  onToggleRoster: (rosterId: number) => void;
  lineupFor: (rosterId: number) => LineupSlot[];
  playerDirectory: PlayerDirectory | null;
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
          <span className="text-right">Record</span>
        </div>
        <div className="scoreboard-scrollbar max-h-[min(58rem,calc(100vh-15rem))] space-y-2.5 overflow-y-auto pr-1">
          {teams.map((team, teamIndex) => {
            const isOpen = openRosterId === team.rosterId;
            const lineup = lineupFor(team.rosterId);
            return (
              <div key={`${style.name}-${team.name}`}>
                <button
                  type="button"
                  onClick={() => onToggleRoster(team.rosterId)}
                  aria-expanded={isOpen}
                  className={`w-full grid items-center gap-3 border bg-black/22 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm transition hover:border-[#62dfff]/35 hover:bg-white/[0.075] ${style.rowClass} ${
                    isOpen ? 'border-[#62dfff]/45' : 'border-white/10'
                  }`}
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
                    <p className="mt-1 truncate text-xs font-semibold text-white/46">
                      {team.managerName} | {team.points} PF
                    </p>
                  </div>
                  <span className="text-sm font-black text-[#62dfff]">{team.record}</span>
                </button>

                {isOpen && (
                  <div className="border border-t-0 border-[#62dfff]/45 bg-black/32 px-3 py-2">
                    <div className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
                      <p className="text-[0.6rem] font-black uppercase tracking-[0.16em] text-white/60">
                        {team.managerName} · this week
                      </p>
                      <p className="shrink-0 text-[0.6rem] font-black uppercase tracking-[0.14em] text-white/30">
                        Starting lineup
                      </p>
                    </div>
                    {lineup.length > 0 ? (
                      <ul>
                        {lineup.map((entry, index) => {
                          const player = playerDirectory?.[entry.playerId];
                          return (
                            <li
                              key={`${entry.playerId}-${index}`}
                              className="flex items-center gap-2.5 border-b border-white/[0.05] py-1.5 last:border-b-0"
                            >
                              <span className="w-9 shrink-0 text-[0.55rem] font-black uppercase tracking-[0.08em] text-[#a78bfa]">
                                {entry.slot}
                              </span>
                              <PlayerAvatar
                                playerId={entry.playerId}
                                player={player}
                                className="h-7 w-7"
                              />
                              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-white/72">
                                {formatPlayerName(entry.playerId, playerDirectory)}
                              </span>
                              <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-white/48">
                                {entry.points.toFixed(2)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="py-3 text-xs font-semibold text-white/40">
                        Lineup appears once this week&rsquo;s matchup is posted.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-4 border-t border-white/10 pt-3 text-xs font-semibold text-white/40">
          Pulled live from Sleeper. Once games start logging scores, records and PF will update here automatically.
        </p>
      </div>
    </article>
  );
}

// The three weekly numbers, with the closest game as a full-width banner under
// them: its two team names need the whole row to fit, and the extra width is
// what makes it read as the headline rather than a fourth statistic.
// One half of the head-to-head: avatar, team, and its form. Mirrored on the
// right so the VS badge sits at the centre of the row.
function WinTick({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden
      className={`h-3 w-3 shrink-0 text-[#4ade80] ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 6.4 4.8 9.2 10 3.4" />
    </svg>
  );
}

function MatchupSide({ side, align }: { side: MatchupSide; align: 'left' | 'right' }) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2.5 ${
        align === 'right' ? 'sm:flex-row-reverse sm:text-right' : ''
      }`}
    >
      <TeamAvatar team={side.team} className="h-9 w-9 shrink-0 rounded-full sm:h-10 sm:w-10" />
      <div className="min-w-0">
        <p className="truncate text-sm font-black leading-tight text-white sm:text-base">
          {side.team.name}
        </p>
        <p className="mt-1 truncate text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white/38">
          {side.team.record} · {side.points.toFixed(2)} pts
        </p>
      </div>
    </div>
  );
}

// One side's starting nine. Slot labels come from the league's own
// roster_positions, so a settings change is reflected without touching this.
function LineupColumn({
  side,
  playerDirectory,
}: {
  side: MatchupSide;
  playerDirectory: PlayerDirectory | null;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
        <p className="truncate text-[0.65rem] font-black uppercase tracking-[0.16em] text-white/72">
          {side.team.name}
        </p>
        <p className="shrink-0 font-mono text-sm font-bold text-[#62dfff]">
          {side.points.toFixed(2)}
        </p>
      </div>
      <ul className="mt-1">
        {side.lineup.map((entry, index) => (
          <li
            key={`${entry.playerId}-${index}`}
            className="flex items-center gap-2.5 border-b border-white/[0.05] py-1.5 last:border-b-0"
          >
            <span className="w-9 shrink-0 text-[0.6rem] font-black uppercase tracking-[0.1em] text-[#a78bfa]">
              {entry.slot}
            </span>
            <PlayerAvatar
              playerId={entry.playerId}
              player={playerDirectory?.[entry.playerId]}
              className="h-6 w-6"
            />
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-white/72">
              {formatPlayerName(entry.playerId, playerDirectory)}
            </span>
            <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-white/58">
              {entry.points.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HeroStats({
  stats,
  matchup,
  playerDirectory,
  showLineups,
  onToggleLineups,
  streak,
  showStreak,
}: {
  stats: HeroStat[];
  matchup: ClosestMatchup | null;
  playerDirectory: PlayerDirectory | null;
  showLineups: boolean;
  onToggleLineups: () => void;
  streak: StreakDetail | null;
  showStreak: boolean;
}) {
  return (
    <div className="mt-9 max-w-2xl">
      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat) => {
          const Tag = stat.onClick ? 'button' : 'article';
          return (
            <Tag
              key={stat.label}
              {...(stat.onClick
                ? { type: 'button' as const, onClick: stat.onClick, 'aria-expanded': stat.expanded }
                : {})}
              className={`group relative min-h-32 overflow-hidden border border-[#a78bfa]/22 bg-[#0d0b16]/92 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_48px_rgba(167,139,250,0.10)] backdrop-blur-sm ${
                stat.onClick ? 'transition hover:border-[#62dfff]/45' : ''
              }`}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#a78bfa] via-[#62dfff] to-transparent" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_86%_12%,rgba(98,223,255,0.18),transparent_32%),linear-gradient(118deg,rgba(167,139,250,0.15),transparent_38%)]" />
              <div className="relative flex h-full flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[0.65rem] font-black uppercase leading-tight tracking-[0.14em] text-[#62dfff]">
                    {stat.label}
                  </p>
                  {stat.avatarTeam && (
                    <TeamAvatar team={stat.avatarTeam} className="h-8 w-8 rounded-full" />
                  )}
                  {stat.avatarPlayerId && (
                    <PlayerAvatar
                      playerId={stat.avatarPlayerId}
                      player={playerDirectory?.[stat.avatarPlayerId]}
                      className="h-8 w-8"
                    />
                  )}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <p className="truncate text-2xl font-black text-white sm:text-3xl">{stat.value}</p>
                    {stat.checks ? (
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: Math.min(stat.checks, 5) }).map((_, index) => (
                          <WinTick key={index} />
                        ))}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 line-clamp-2 border-t border-white/10 pt-2 text-xs font-semibold leading-snug text-white/48">
                    {stat.subject}
                  </p>
                  {stat.detail && (
                    <p className="mt-1 truncate text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white/32">
                      {stat.detail}
                    </p>
                  )}
                </div>
              </div>
            </Tag>
          );
        })}
      </div>

      {streak && showStreak && (
        <article className="relative mt-2 overflow-hidden border border-[#4ade80]/25 bg-[#0d0b16]/92 p-4 backdrop-blur-sm">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4ade80]/80 via-[#62dfff] to-transparent" />
          <div className="relative">
            <div className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
              <p className="truncate text-[0.65rem] font-black uppercase tracking-[0.16em] text-white/72">
                {streak.team.name}
              </p>
              <p className="shrink-0 text-[0.6rem] font-black uppercase tracking-[0.14em] text-[#4ade80]">
                {streak.length} in a row
              </p>
            </div>
            <ul className="mt-1">
              {streak.games.map((game) => (
                <li
                  key={game.week}
                  className="flex items-center gap-3 border-b border-white/[0.05] py-1.5 last:border-b-0"
                >
                  <span className="w-8 shrink-0 font-mono text-[0.65rem] font-bold text-white/32">
                    W{game.week}
                  </span>
                  <WinTick />
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-white/72">
                    beat {game.opponent}
                  </span>
                  <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-white/48">
                    {game.points.toFixed(2)} - {game.opponentPoints.toFixed(2)}
                  </span>
                </li>
              ))}
              {streak.next && (
                <li className="flex items-center gap-3 border-t border-white/10 pt-2">
                  <span className="w-8 shrink-0 font-mono text-[0.65rem] font-bold text-white/32">
                    W{streak.next.week}
                  </span>
                  <span aria-hidden className="text-[0.6rem] text-[#62dfff]">
                    ▸
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-white/50">
                    vs {streak.next.opponent}
                  </span>
                  <span className="shrink-0 text-[0.6rem] font-black uppercase tracking-[0.14em] text-[#62dfff]">
                    Up next
                  </span>
                </li>
              )}
            </ul>
          </div>
        </article>
      )}

      <article
        // Named for the view transition, so opening the lineups morphs the
        // card the same way the Bouseathlon event cards grow.
        style={{ viewTransitionName: 'matchup-card' }}
        className="relative mt-2 overflow-hidden border border-[#62dfff]/28 bg-[#0d0b16]/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_48px_rgba(167,139,250,0.10)] backdrop-blur-sm"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#62dfff] via-[#a78bfa] to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_92%_14%,rgba(98,223,255,0.20),transparent_38%),linear-gradient(118deg,rgba(167,139,250,0.14),transparent_44%)]" />

        {matchup ? (
          <>
            <button
              type="button"
              onClick={onToggleLineups}
              aria-expanded={showLineups}
              className="group relative flex min-h-24 w-full items-center p-4 text-left"
            >
              <div className="w-full min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-[#62dfff]">
                    Matchup of the week
                  </p>
                  <span className="shrink-0 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-white/30 transition group-hover:text-[#62dfff]">
                    {showLineups ? 'Hide lineups' : 'Lineups'}
                  </span>
                </div>
                <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <MatchupSide side={matchup.home} align="left" />
                  <span className="shrink-0 self-center border border-[#62dfff]/30 bg-[#62dfff]/10 px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-[0.18em] text-[#62dfff] sm:self-auto">
                    vs
                  </span>
                  <MatchupSide side={matchup.away} align="right" />
                </div>
              </div>
            </button>

            {showLineups && (
              <div className="relative grid gap-x-6 gap-y-5 border-t border-white/10 px-4 pb-4 pt-4 sm:grid-cols-2">
                <LineupColumn side={matchup.home} playerDirectory={playerDirectory} />
                <LineupColumn side={matchup.away} playerDirectory={playerDirectory} />
              </div>
            )}
          </>
        ) : (
          <div className="relative flex min-h-24 items-center p-4">
            <div className="w-full min-w-0">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-[#62dfff]">
                Matchup of the week
              </p>
              <p className="mt-1.5 text-base font-black leading-snug text-white sm:text-lg">
                The tightest game appears once scores land
              </p>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}

export default function LeagueDashboard() {
  const [leagueData, setLeagueData] = useState<LeagueResponse | null>(null);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [playerDirectory, setPlayerDirectory] = useState<PlayerDirectory | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'offline'>('loading');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLineups, setShowLineups] = useState(false);
  const [results, setResults] = useState<ResultsResponse | null>(null);
  const [openRosterId, setOpenRosterId] = useState<number | null>(null);
  const [showStreak, setShowStreak] = useState(false);

  const loadLeague = useCallback(async (shouldUpdate: () => boolean = () => true) => {
    setIsRefreshing(true);

    try {
      const leagueResponse = await fetch(`${apiBaseUrl}/api/league`, { cache: 'no-store' });
      if (!leagueResponse.ok) {
        throw new Error('League request failed');
      }

      const data = (await leagueResponse.json()) as LeagueResponse;
      const week = data.state?.week || 1;
      const matchupsResponse = await fetch(`${apiBaseUrl}/api/league/matchups/${week}`, { cache: 'no-store' });
      const matchupData: { matchups?: Matchup[] } = matchupsResponse.ok
        ? await matchupsResponse.json()
        : { matchups: [] };

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

  useEffect(() => {
    // Every id on every roster, starters included: the lineups in the matchup
    // card need names too, not just the bench player behind Bench Pain.
    // Team defences are keyed by abbreviation ("DAL"), so the old length > 3
    // filter silently dropped all nine of them.
    const rosterPlayerIds = [
      ...new Set(matchups.flatMap((matchup) => matchup.players || [])),
    ];

    const missingPlayerIds = rosterPlayerIds.filter((playerId) => !playerDirectory?.[playerId]);
    if (missingPlayerIds.length === 0) {
      return;
    }

    let mounted = true;
    const searchParams = new URLSearchParams({ ids: missingPlayerIds.join(',') });
    void fetch(`${apiBaseUrl}/api/players/nfl?${searchParams.toString()}`, { cache: 'force-cache' })
      .then(async (response): Promise<{ players?: PlayerDirectory } | null> =>
        response.ok ? await response.json() : null,
      )
      .then((data) => {
        if (mounted && data?.players && Object.keys(data.players).length > 0) {
          setPlayerDirectory((current) => ({ ...(current || {}), ...data.players }));
        }
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [matchups, playerDirectory]);

  const teams = useMemo(() => (leagueData ? buildTeams(leagueData) : fallbackTeams), [leagueData]);
  const isLiveLeague = Boolean(leagueData);
  const currentWeek = leagueData?.state.week || 1;
  const streak = useMemo(() => buildStreak(results, teams), [results, teams]);


  // The results feed is keyed to the week, not the 60s standings poll: a past
  // week's outcome cannot change, so re-fetching it every minute is waste.
  useEffect(() => {
    if (!isLiveLeague) return;

    let mounted = true;
    void fetch(`${apiBaseUrl}/api/league/results`, { cache: 'no-store' })
      .then(async (response): Promise<ResultsResponse | null> =>
        response.ok ? await response.json() : null,
      )
      .then((data) => {
        if (mounted && data?.weeks) setResults(data);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [isLiveLeague, currentWeek]);
  const rosterPositions = useMemo(
    () => leagueData?.league.roster_positions || [],
    [leagueData],
  );
  // The current week's matchups are already loaded for the hero cards, so a
  // team's starting lineup is a lookup rather than another request.
  const lineupFor = useCallback(
    (rosterId: number) => {
      const matchup = matchups.find((row) => row.roster_id === rosterId);
      return matchup ? buildLineup(matchup, rosterPositions) : [];
    },
    [matchups, rosterPositions],
  );

  const closestMatchup = useMemo(
    () => (isLiveLeague ? buildClosestMatchup(matchups, teams, rosterPositions) : null),
    [isLiveLeague, matchups, rosterPositions, teams],
  );
  const recapCards = useMemo(
    () => buildRecapCards(teams, matchups, currentWeek, playerDirectory, isLiveLeague),
    [currentWeek, isLiveLeague, matchups, playerDirectory, teams],
  );
  const records = useMemo(
    () => buildRecordCards(teams, currentWeek, isLiveLeague),
    [currentWeek, isLiveLeague, teams],
  );
  const leagueName = leagueData?.league.name || 'Bose In The Nose';
  const season = leagueData?.league.season || '2026';
  const totalManagers = leagueData?.league.total_rosters || 14;
  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Not yet';
  const highScoreCard = recapCards.find((card) => card.label === 'High Score') || fallbackRecapCards[0];
  const benchPainCard = recapCards.find((card) => card.label === 'Bench Pain') || fallbackRecapCards[2];
  const streakCard = records.find((record) => record.label === 'Longest Streak') || fallbackRecords[3];
  const heroStats: HeroStat[] = [
    {
      value: highScoreCard.value,
      label: 'Highest score',
      subject: highScoreCard.team,
      avatarTeam: highScoreCard.teamRef,
    },
    {
      value: benchPainCard.value,
      label: 'Bench pain',
      subject: benchPainCard.team,
      detail: benchPainCard.owner,
      avatarPlayerId: benchPainCard.playerId,
    },
    streak
      ? {
          value: `${streak.length}W`,
          label: 'Longest win streak',
          subject: streak.team.name,
          detail: streak.next ? `next: ${streak.next.opponent}` : undefined,
          checks: streak.length,
          avatarTeam: streak.team,
          onClick: () =>
            void withViewTransition(() => setShowStreak((open) => !open), {
              flavour: showStreak ? 'close' : 'open',
            }),
          expanded: showStreak,
        }
      : { value: streakCard.value, label: 'Longest win streak', subject: streakCard.team },
  ];


  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#050608] text-[#f5f8fb]">
      <PageBackground />
      <header className="sticky top-0 z-20 bg-transparent">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/48 to-transparent" />
        <nav className="relative mx-auto flex min-h-20 max-w-7xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <a href="#home" className="group flex min-w-0 flex-col" aria-label={`${leagueName} home`}>
            {/* league-mark-broadcast is one of the wordmark styles already in
                globals.css: heavy, white, with the cyan glow the rest of the
                page uses. */}
            <span className="league-mark-broadcast text-2xl tracking-tight transition group-hover:text-white sm:text-3xl">
              {splitLeagueName(leagueName)}
            </span>
            <span className="mt-1.5 text-[0.6rem] font-black uppercase tracking-[0.3em] text-[#62dfff]/70">
              Season {season}
            </span>
          </a>
          <div className="flex w-fit max-w-full flex-wrap items-center gap-x-7 gap-y-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="py-1 text-sm font-semibold text-white/72 transition hover:text-[#f9d98a]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <section id="home" className="relative z-10 mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-start gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:py-28">
        <div className="min-w-0 max-w-3xl lg:pt-28">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.32em] text-[#62dfff]">
            {season} league command center
          </p>
          <h1 className="text-[clamp(2.25rem,5vw,4.5rem)] font-black leading-[0.98] tracking-normal text-white">
            Bragging rights, settled weekly.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/70">
            Standings update live. Excuses don&rsquo;t.
          </p>
          <HeroStats
            stats={heroStats}
            matchup={closestMatchup}
            playerDirectory={playerDirectory}
            streak={streak}
            showStreak={showStreak}
            showLineups={showLineups}
            onToggleLineups={() =>
              void withViewTransition(() => setShowLineups((open) => !open), {
                flavour: showLineups ? 'close' : 'open',
              })
            }
          />
        </div>

        <ScoreboardMockup
          teams={teams}
          status={status}
          lastUpdatedLabel={lastUpdatedLabel}
          totalManagers={totalManagers}
          style={selectedScoreboardStyle}
          isRefreshing={isRefreshing}
          onRefresh={() => loadLeague()}
          openRosterId={openRosterId}
          onToggleRoster={(rosterId) =>
            void withViewTransition(
              () => setOpenRosterId((current) => (current === rosterId ? null : rosterId)),
              { flavour: openRosterId === rosterId ? 'close' : 'open' },
            )
          }
          lineupFor={lineupFor}
          playerDirectory={playerDirectory}
        />
      </section>

      <SponsorStrip />
    </main>
  );
}
