# Bose In The Nose

Dark-mode fantasy league website with a separate backend prepared for Sleeper API data.

## Frontend

```bash
npm run dev
```

The current site includes:

- Home
- Highlights
- Dark mode only
- Static placeholder league data ready to swap for backend responses

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
