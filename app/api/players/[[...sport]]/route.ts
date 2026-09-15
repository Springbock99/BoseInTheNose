import playersJson from '@/app/data/players.json';

type PlayerMeta = {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  position?: string;
  team?: string;
};

// Served from a build-time artifact rather than Sleeper's live ~14 MB dump:
// fetching that inside a request would make every cold start several seconds
// slow. Refresh with `npm run players`.
const players = playersJson as Record<string, PlayerMeta>;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sport?: string[] }> },
) {
  const { sport = [] } = await params;
  if (sport.length > 0 && sport[0] !== 'nfl') {
    return Response.json({ error: `Unsupported sport: ${sport[0]}` }, { status: 400 });
  }

  const idsParam = new URL(request.url).searchParams.get('ids');
  const requestedIds = idsParam
    ? idsParam.split(',').map((id) => id.trim()).filter(Boolean)
    : [];

  if (requestedIds.length > 0) {
    const subset: Record<string, PlayerMeta> = {};
    for (const id of requestedIds) {
      if (players[id]) subset[id] = players[id];
    }
    return Response.json({ players: subset });
  }

  return Response.json({ players });
}
