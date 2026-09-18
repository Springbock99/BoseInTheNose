import { leagueIdFrom, sleeper, upstreamFailed } from '@/app/lib/sleeper';

// One catch-all rather than separate files, because the Express routes it
// replaces overlapped: /api/league/matchups/1 and /api/league/:leagueId are the
// same shape, and only the segment values tell them apart.
//
//   []                          -> league, default id
//   [leagueId]                  -> league
//   ['matchups', week]          -> matchups, default id
//   [leagueId, 'matchups', week]-> matchups
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ segments?: string[] }> },
) {
  const { segments = [] } = await params;

  const matchupsAt = segments.indexOf('matchups');
  const isMatchups = matchupsAt !== -1;
  const explicitId = isMatchups
    ? matchupsAt > 0
      ? segments[0]
      : undefined
    : segments[0];

  const leagueId = leagueIdFrom(explicitId);

  try {
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
