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
| `/api/injuries?ids=1,2,3` | current player injury flags and snapshot timestamp for those ids |
| `/api/health` | liveness check |

The homepage Injury Ward ranks managers by players marked Out or Injured
Reserve, including bench and reserve players without double-counting. Doubtful
and Questionable appear separately. Tied leaders share the Chief Excuse Officer
title. Missing player data suppresses the title and is labeled incomplete.

Injury data comes from a separate Sleeper player snapshot cached for 24 hours
on the server; it does not depend on rebuilding `players.json`. The UI displays
the snapshot time, checks for refreshed data hourly while open, and labels a
stale report when the upstream service cannot refresh. This is a current roster
report, not a season-long injury history.

## Highlights design preview

The homepage Replay Room (`#highlights`) has an inline YouTube player, a clip
selector, and category filters. `app/data/highlights.ts` contains three real
official NFL videos from the 2024 season, explicitly labeled as archive footage.
The weekly feed is not connected; these videos do not update automatically.
No video files are downloaded or rehosted. The player loads only after a click.
The three archive samples currently reject external playback in Chrome. They
are design references, not verified playable sources. The player handles
publisher errors and loading failures with an explicit message and source link.
An embeddable source must be verified before this is released as an inline
weekly highlights feature.

For a production feed, use Sleeper's season, season type and week as context,
then a server-side YouTube Data API integration to discover official NFL
uploads and verify publication dates, season/week labels and embedding status.
Sleeper's documented public API does not supply highlight videos or a best-play
ranking. Prefer the NFL's own top-play selections, not raw view counts. Cache
source checks hourly, show the content's actual week and the last successful
check time, and keep the previous labeled week until new videos are available.
That integration needs a server-side YouTube Data API key; the design preview
requires no key. Region and publisher playback restrictions can still apply.

## Tests

```bash
npm run test:rules
npm run test:injuries
```

Covers the rulebook converter, the search index and highlight segmentation.

## Deploying

The project builds with the standard Next CLI and deploys to Vercel with no
configuration. Set `SLEEPER_LEAGUE_ID` in the project's environment variables.
