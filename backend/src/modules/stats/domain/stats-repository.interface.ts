export const STATS_REPOSITORY = 'STATS_REPOSITORY';

export interface StatsTeamInfo {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
}

export interface StatsMatchResult {
  id: string;
  matchDate: Date;
  competitionName: string;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
  homeTeam: StatsTeamInfo;
  awayTeam: StatsTeamInfo;
}

/**
 * Puerto (Repository pattern) para consultas estadisticas de solo lectura
 * sobre los agregados Team y Match. La implementacion concreta vive en
 * infrastructure/repositories.
 */
export interface IStatsRepository {
  findTeamInfo(teamId: string): Promise<StatsTeamInfo | null>;
  findRecentFinishedMatches(
    teamId: string,
    limit: number,
  ): Promise<StatsMatchResult[]>;
  findHeadToHeadMatches(
    teamAId: string,
    teamBId: string,
  ): Promise<StatsMatchResult[]>;
}
