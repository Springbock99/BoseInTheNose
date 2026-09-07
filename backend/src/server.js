import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import { createSleeperClient } from './sleeperClient.js';

const app = express();
const sleeper = createSleeperClient();
const port = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json());

function getLeagueId(request) {
  return request.params.leagueId || process.env.SLEEPER_LEAGUE_ID;
}

function requireLeagueId(request, response, next) {
  if (!getLeagueId(request)) {
    response.status(400).json({
      error: 'Missing league id. Set SLEEPER_LEAGUE_ID or pass /api/league/:leagueId.',
    });
    return;
  }

  next();
}

app.get('/health', (_request, response) => {
  response.json({ ok: true, service: 'bose-in-the-nose-backend' });
});

app.get(['/api/league', '/api/league/:leagueId'], requireLeagueId, async (request, response, next) => {
  try {
    const leagueId = getLeagueId(request);
    const [league, users, rosters, state] = await Promise.all([
      sleeper.getLeague(leagueId),
      sleeper.getLeagueUsers(leagueId),
      sleeper.getRosters(leagueId),
      sleeper.getSportState(),
    ]);

    response.json({ league, users, rosters, state });
  } catch (error) {
    next(error);
  }
});

app.get(['/api/league/matchups/:week', '/api/league/:leagueId/matchups/:week'], requireLeagueId, async (request, response, next) => {
  try {
    const matchups = await sleeper.getMatchups(getLeagueId(request), request.params.week);
    response.json({ week: Number(request.params.week), matchups });
  } catch (error) {
    next(error);
  }
});

app.get('/api/trending', async (request, response, next) => {
  try {
    const players = await sleeper.getTrendingPlayers({
      type: request.query.type === 'drop' ? 'drop' : 'add',
      hours: Number(request.query.hours || 24),
      limit: Number(request.query.limit || 10),
    });

    response.json({ players });
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  response.status(502).json({
    error: 'Sleeper API request failed.',
    detail: error.message,
  });
});

app.listen(port, () => {
  console.log(`Bose In The Nose backend listening on http://localhost:${port}`);
});
