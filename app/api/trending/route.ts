import { sleeper, upstreamFailed } from '@/app/lib/sleeper';

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;

  try {
    const players = await sleeper.getTrendingPlayers({
      type: searchParams.get('type') === 'drop' ? 'drop' : 'add',
      hours: Number(searchParams.get('hours') || 24),
      limit: Number(searchParams.get('limit') || 10),
    });

    return Response.json({ players });
  } catch (error) {
    return upstreamFailed(error);
  }
}
