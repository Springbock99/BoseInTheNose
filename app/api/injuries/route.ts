import { unstable_cache } from 'next/cache';
import { injuryStatus, type InjuryPlayer } from '@/app/lib/injuries';
import { upstreamFailed } from '@/app/lib/sleeper';

// Cache the trimmed result: the full upstream dump exceeds Next's fetch-cache
// entry limit. Sleeper asks consumers to fetch this feed at most once per day.
const getInjurySnapshot = unstable_cache(async () => {
  const response = await fetch('https://api.sleeper.app/v1/players/nfl', {
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
    headers: { accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Player feed returned ${response.status}`);
  const raw = await response.json() as Record<string, {
    full_name?: string; first_name?: string; last_name?: string;
    position?: string; team?: string; status?: string; injury_status?: string;
  }>;
  if (!raw || Array.isArray(raw) || Object.keys(raw).length < 1000) {
    throw new Error('Incomplete player feed');
  }
  const players: Record<string, InjuryPlayer> = {};
  for (const [id, player] of Object.entries(raw)) {
    if (!player) continue;
    players[id] = {
      name: player.full_name || [player.first_name, player.last_name].filter(Boolean).join(' ') || `Player ${id}`,
      position: player.position,
      team: player.team,
      injury: injuryStatus(player),
    };
  }
  return { players, fetchedAt: new Date().toISOString() };
}, ['injury-snapshot-v1'], { revalidate: 86_400 });

export async function GET(request: Request) {
  const ids = [...new Set((new URL(request.url).searchParams.get('ids') ?? '').split(',').filter(Boolean))];
  if (!ids.length || ids.length > 1000 || ids.some((id) => !/^[a-zA-Z0-9]+$/.test(id))) {
    return Response.json({ error: 'Supply between 1 and 1000 player IDs.' }, { status: 400 });
  }
  try {
    const snapshot = await getInjurySnapshot();
    return Response.json({
      players: Object.fromEntries(ids.filter((id) => snapshot.players[id]).map((id) => [id, snapshot.players[id]])),
      fetchedAt: snapshot.fetchedAt,
    });
  } catch (error) {
    return upstreamFailed(error);
  }
}
