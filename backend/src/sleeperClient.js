const SLEEPER_BASE_URL = 'https://api.sleeper.app/v1';
const playerCache = new Map();

async function request(path) {
  const response = await fetch(`${SLEEPER_BASE_URL}${path}`, {
    headers: {
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Sleeper request failed (${response.status}): ${body}`);
  }

  return response.json();
}

export function createSleeperClient() {
  return {
    getLeague: (leagueId) => request(`/league/${leagueId}`),
    getLeagueUsers: (leagueId) => request(`/league/${leagueId}/users`),
    getRosters: (leagueId) => request(`/league/${leagueId}/rosters`),
    getMatchups: (leagueId, week) => request(`/league/${leagueId}/matchups/${week}`),
    getDrafts: (leagueId) => request(`/league/${leagueId}/drafts`),
    getPlayers: async (sport = 'nfl') => {
      const cached = playerCache.get(sport);
      if (cached) {
        return cached;
      }

      const players = await request(`/players/${sport}`);
      playerCache.set(sport, players);
      return players;
    },
    getSportState: (sport = 'nfl') => request(`/state/${sport}`),
    getTrendingPlayers: ({ sport = 'nfl', type = 'add', hours = 24, limit = 10 } = {}) =>
      request(`/players/${sport}/trending/${type}?lookback_hours=${hours}&limit=${limit}`),
  };
}
