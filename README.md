# Bose In The Nose

Dark-mode fantasy league website for the BouseInTheNose league, backed by the
Sleeper API and a searchable copy of the league rulebook.

## Running locally

```bash
npm install
npm run dev
```

Create `.env.local` with the league id:

```
SLEEPER_LEAGUE_ID=your_league_id_here
```

This is read server-side only and never reaches the browser.

## Layout

```
app/
  page.tsx            league dashboard (standings, highlights)
  rules/              searchable rulebook
  stats/              parked stat ideas
  api/                Sleeper proxy routes
  lib/sleeper.ts      Sleeper client
  data/               generated: rules.json, players.json
scripts/              the generators for app/data
docs/                 rulebook master document and design specs
```

## Generated data

Two files in `app/data/` are derived, not hand-edited.

| Command | Produces | Source |
|---|---|---|
| `npm run rules` | `app/data/rules.json` | `docs/rulebook-master.docx` |
| `npm run players` | `app/data/players.json` | Sleeper's player dump |

`rules.json` is parsed from the Word rulebook, so amendments mean editing the
.docx and re-running the command.

`players.json` exists because Sleeper's player endpoint returns ~14 MB across
12k players with 53 fields each. The UI reads five of those fields, so the dump
is trimmed at build time rather than fetched inside a request. Re-run it when
rosters have moved on.

## API

All routes are same-origin under `/api`, so there is no CORS setup and no API
base URL to configure.

| Route | Returns |
|---|---|
| `/api/league` | league, users, rosters, sport state |
| `/api/league/:leagueId` | the same, for an explicit league |
| `/api/league/matchups/:week` | matchups for a week |
| `/api/league/:leagueId/matchups/:week` | matchups for an explicit league |
| `/api/trending` | trending adds or drops |
| `/api/players?ids=1,2,3` | name, position and team for those ids |
| `/api/health` | liveness check |

## Tests

```bash
npm run test:rules
```

Covers the rulebook converter, the search index and highlight segmentation.

## Deploying

The project builds with the standard Next CLI and deploys to Vercel with no
configuration. Set `SLEEPER_LEAGUE_ID` in the project's environment variables.
