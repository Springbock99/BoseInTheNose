import { leagueIdFrom, sleeper, upstreamFailed } from '@/app/lib/sleeper';

// One catch-all rather than separate files, because the Express routes it
// replaces overlapped: /api/league/matchups/1 and /api/league/:leagueId are the
// same shape, and only the segment values tell them apart.
//
//   []                          -> league, default id
//   [leagueId]                  -> league
//   ['results']                 -> every decided week so far
//   ['matchups', week]          -> matchups, default id
//   [leagueId, 'matchups', week]-> matchups
type WeekMatchup = { roster_id: number; matchup_id: number; points: number };

// Sleeper returns one row per team; the matchup_id is what makes two rows a
// game. A team without a partner (bye, or an odd league) is dropped.
function pairByMatchup(matchups: WeekMatchup[]) {
  const byMatchupId = new Map<number, WeekMatchup[]>();
  for (const row of matchups) {
    byMatchupId.set(row.matchup_id, [...(byMatchupId.get(row.matchup_id) || []), row]);
  }

  return [...byMatchupId.values()]
    .filter((game) => game.length === 2)
    .flatMap(([a, b]) => [
      { rosterId: a.roster_id, points: a.points, opponentId: b.roster_id, opponentPoints: b.points },
      { rosterId: b.roster_id, points: b.points, opponentId: a.roster_id, opponentPoints: a.points },
    ]);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ segments?: string[] }> },
) {
  const { segments = [] } = await params;

  const matchupsAt = segments.indexOf('matchups');
  const isMatchups = matchupsAt !== -1;
  // A leading segment is a league id only when it is not one of the keywords,
  // otherwise /api/league/results asks Sleeper for a league called "results".
  const [first] = segments;
  const explicitId = first && first !== 'matchups' && first !== 'results' ? first : undefined;

  const leagueId = leagueIdFrom(explicitId);

  try {
    // Form guides need every week, not just the current one. The fan-out runs
    // here rather than in the browser: each week is separately cached upstream,
    // so this is one request for the client and mostly cache hits for us.
    if (segments.includes('results')) {
      const state = (await sleeper.getSportState()) as { week?: number };
      const throughWeek = Math.min(Math.max(state.week ?? 1, 1), 18);
      const weekNumbers = Array.from({ length: throughWeek }, (_, index) => index + 1);

      const weeks = await Promise.all(
        weekNumbers.map(async (week) => {
          const matchups = (await sleeper.getMatchups(leagueId, week)) as WeekMatchup[];
          return { week, entries: pairByMatchup(matchups) };
        }),
      );

      return Response.json({ throughWeek, weeks });
    }

    if (isMatchups) {
      const week = segments[matchupsAt + 1];
      if (!week) {
        return Response.json({ error: 'Missing week.' }, { status: 400 });
      }
      const matchups = await sleeper.getMatchups(leagueId, week);
      return Response.json({ week: Number(week), matchups });
    }

    const [league, users, rosters, state] = await Promise.all([
      sleeper.getLeague(leagueId),
      sleeper.getLeagueUsers(leagueId),
      sleeper.getRosters(leagueId),
      sleeper.getSportState(),
    ]);

    return Response.json({ league, users, rosters, state });
  } catch (error) {
    return upstreamFailed(error);
  }
}
