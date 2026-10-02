export type InjuryStatus = 'IR' | 'Out' | 'Doubtful' | 'Questionable';

export type InjuryPlayer = {
  name: string;
  position?: string;
  team?: string;
  injury: InjuryStatus | null;
};

export type InjuryRoster = {
  roster_id: number;
  players?: string[];
  reserve?: string[];
  starters?: string[];
};

export type InjuryTeam = { rosterId: number; name: string; managerName: string; avatarUrl?: string };
export type InjurySnapshot = { players: Record<string, InjuryPlayer>; fetchedAt: string };

export function injuryStatus(player: { status?: string | null; injury_status?: string | null }): InjuryStatus | null {
  const statuses = [player.status, player.injury_status].map((value) => value?.trim().toLowerCase());
  if (statuses.some((value) => value === 'injured reserve' || value === 'ir')) return 'IR';
  if (statuses.includes('out')) return 'Out';
  if (statuses.includes('doubtful')) return 'Doubtful';
  if (statuses.includes('questionable')) return 'Questionable';
  return null;
}

export function rosterPlayerIds(roster: InjuryRoster): string[] {
  return [...new Set([...(roster.players ?? []), ...(roster.reserve ?? []), ...(roster.starters ?? [])])]
    .filter((id) => id !== '0');
}

const severity: Record<InjuryStatus, number> = { IR: 0, Out: 1, Doubtful: 2, Questionable: 3 };

export function rankInjuries(teams: InjuryTeam[], rosters: InjuryRoster[], directory: InjurySnapshot['players']) {
  return teams.map((team) => {
    const roster = rosters.find((entry) => entry.roster_id === team.rosterId);
    const ids = roster ? rosterPlayerIds(roster) : [];
    const starters = new Set(roster?.starters ?? []);
    const players = ids.flatMap((id) => {
      const player = directory[id];
      return player?.injury ? [{ ...player, injury: player.injury, id, starting: starters.has(id) }] : [];
    }).sort((a, b) => severity[a.injury] - severity[b.injury] || a.name.localeCompare(b.name));
    return {
      ...team,
      players,
      incomplete: !roster || !Array.isArray(roster.players) || ids.some((id) => !directory[id]),
      out: players.filter((player) => player.injury === 'Out' || player.injury === 'IR').length,
      doubtful: players.filter((player) => player.injury === 'Doubtful').length,
      questionable: players.filter((player) => player.injury === 'Questionable').length,
    };
  }).sort((a, b) => b.out - a.out || a.managerName.localeCompare(b.managerName) || a.rosterId - b.rosterId);
}
