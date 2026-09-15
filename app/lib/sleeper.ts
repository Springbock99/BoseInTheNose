const SLEEPER_BASE_URL = 'https://api.sleeper.app/v1';

export class SleeperError extends Error {}

async function request<T>(path: string, revalidate: number): Promise<T> {
  const response = await fetch(`${SLEEPER_BASE_URL}${path}`, {
    headers: { accept: 'application/json' },
    // Route handlers run per request; Next's fetch cache keeps a hot upstream
    // response shared across invocations instead of re-fetching every time.
    next: { revalidate },
  });

  if (!response.ok) {
    throw new SleeperError(`Sleeper request failed: ${response.status} ${path}`);
  }

  return (await response.json()) as T;
}

// Live competitive data: short window, still enough to absorb a refresh burst.
const LIVE = 60;
// Season-level settings change rarely.
const SLOW = 3600;

export const sleeper = {
  getLeague: (leagueId: string) => request(`/league/${leagueId}`, SLOW),
  getLeagueUsers: (leagueId: string) => request(`/league/${leagueId}/users`, SLOW),
  getRosters: (leagueId: string) => request(`/league/${leagueId}/rosters`, LIVE),
  getMatchups: (leagueId: string, week: string | number) =>
    request(`/league/${leagueId}/matchups/${week}`, LIVE),
  getSportState: (sport = 'nfl') => request(`/state/${sport}`, LIVE),
  getTrendingPlayers: ({
    sport = 'nfl',
    type = 'add',
    hours = 24,
    limit = 10,
  }: { sport?: string; type?: string; hours?: number; limit?: number } = {}) =>
    request(`/players/${sport}/trending/${type}?lookback_hours=${hours}&limit=${limit}`, LIVE),
};

export function leagueIdFrom(explicit?: string) {
  return explicit || process.env.SLEEPER_LEAGUE_ID || '';
}

export function missingLeagueId() {
  return Response.json(
    { error: 'Missing league id. Set SLEEPER_LEAGUE_ID or pass /api/league/:leagueId.' },
    { status: 400 },
  );
}

export function upstreamFailed(error: unknown) {
  return Response.json(
    {
      error: 'Sleeper API request failed.',
      detail: error instanceof Error ? error.message : String(error),
    },
    { status: 502 },
  );
}
