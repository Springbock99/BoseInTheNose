# Bose In The Nose

Dark-mode fantasy league website with a separate backend prepared for Sleeper API data.

## Frontend

```bash
npm run dev
```

The frontend reads from `NEXT_PUBLIC_API_BASE_URL`. Locally it defaults to
`http://localhost:8787`, so it will connect to the backend automatically while
both servers are running.

The current site includes:

- Home
- Highlights
- Dark mode only
- Sleeper-powered standings and weekly highlight cards

## Backend

```bash
cd backend
cp .env.example .env
npm run dev
```

Set `SLEEPER_LEAGUE_ID` in `backend/.env`, or pass a league id directly in the URL.

Useful endpoints:

- `GET /health`
- `GET /api/league`
- `GET /api/league/:leagueId`
- `GET /api/league/matchups/:week`
- `GET /api/league/:leagueId/matchups/:week`
- `GET /api/trending?type=add&hours=24&limit=10`

Sleeper API read access does not require an API token.
