import assert from 'node:assert/strict';
import { injuryStatus, rankInjuries, rosterPlayerIds } from '../app/lib/injuries.ts';

assert.equal(injuryStatus({ status: 'Injured Reserve', injury_status: 'Out' }), 'IR');
assert.equal(injuryStatus({ status: 'Active', injury_status: 'Questionable' }), 'Questionable');
assert.equal(injuryStatus({ status: 'Suspended' }), null);
assert.equal(injuryStatus({ status: 'Active', injury_status: null }), null);

const teams = [
  { rosterId: 1, managerName: 'A', name: 'Question marks' },
  { rosterId: 2, managerName: 'B', name: 'Waiting room' },
  { rosterId: 3, managerName: 'C', name: 'Also waiting' },
  { rosterId: 4, managerName: 'D', name: 'Unknown' },
];
const rosters = [
  { roster_id: 1, players: ['q1', 'q2', 'q3'], reserve: [], starters: ['q1', '0'] },
  { roster_id: 2, players: ['out', 'ir'], reserve: ['ir', 'extra'], starters: ['out'] },
  { roster_id: 3, players: ['out', 'ir', 'extra'], reserve: [], starters: [] },
  { roster_id: 4, players: ['missing'], starters: [] },
];
const directory = {
  q1: { name: 'Q1', injury: 'Questionable' },
  q2: { name: 'Q2', injury: 'Questionable' },
  q3: { name: 'Q3', injury: 'Questionable' },
  out: { name: 'Out', injury: 'Out' },
  ir: { name: 'IR', injury: 'IR' },
  extra: { name: 'Reserve only', injury: 'Out' },
};
assert.deepEqual(rosterPlayerIds(rosters[1]), ['out', 'ir', 'extra']);
assert(!rosterPlayerIds(rosters[0]).includes('0'));
const rows = rankInjuries(teams, rosters, directory);
assert.deepEqual(rows.map((row) => row.rosterId), [2, 3, 1, 4]);
assert.equal(rows[0].out, 3, 'IR duplicates must count once; reserve-only players count');
assert.equal(rows[0].out, rows[1].out, 'same unavailable count shares the lead');
assert.equal(rows[0].players.find((player) => player.id === 'out').starting, true);
assert.equal(rows[0].players.find((player) => player.id === 'ir').starting, false);
assert.equal(rows[2].questionable, 3, 'questionable players do not inflate Out + IR ranking');
assert.equal(rows[3].incomplete, true, 'missing data must not imply a healthy roster');
assert.equal(rankInjuries([teams[0]], [], directory)[0].incomplete, true);
assert.equal(rankInjuries([teams[0]], [{ roster_id: 1, players: [] }], directory)[0].incomplete, false);
assert.equal(rankInjuries([teams[0]], [{ roster_id: 1, players: ['ir'], reserve: ['ir'] }], { ir: { name: 'Healthy in fantasy IR slot', injury: null } })[0].out, 0);
console.log('Injury checks passed: status, ranking, ties, reserve deduplication, starters and missing data.');
