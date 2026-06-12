import { Confederation, MatchStage } from '@prisma/client';

export const DASHBOARD_REPOSITORY = 'DASHBOARD_REPOSITORY';

export interface DashboardCounts {
  teams: number;
  competitions: number;
  matches: number;
  predictions: number;
  simulations: number;
}

export interface DashboardMatchesByStatus {
  scheduled: number;
  live: number;
  finished: number;
  postponed: number;
  cancelled: number;
}

export interface DashboardTeamInfo {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
  eloRating: number;
  fifaRanking: number | null;
}

export interface DashboardTeamRef {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
}

export interface DashboardCompetitionRef {
  id: string;
  name: string;
}

export interface DashboardMatchInfo {
  id: string;
  matchDate: Date;
  stage: MatchStage;
  homeGoals: number | null;
  awayGoals: number | null;
  homeTeam: DashboardTeamRef;
  awayTeam: DashboardTeamRef;
  competition: DashboardCompetitionRef;
}

export interface RankedTeam extends DashboardTeamInfo {
  confederation: Confederation;
}

/**
 * Puerto (Repository pattern) para los datos agregados del dashboard.
 * La implementacion concreta vive en infrastructure/repositories.
 */
export interface IDashboardRepository {
  getCounts(): Promise<DashboardCounts>;
  getMatchesByStatus(): Promise<DashboardMatchesByStatus>;
  findTopTeamsByElo(limit: number): Promise<DashboardTeamInfo[]>;
  findUpcomingMatches(limit: number): Promise<DashboardMatchInfo[]>;
  findRecentResults(limit: number): Promise<DashboardMatchInfo[]>;
  findRankedTeams(
    skip: number,
    take: number,
  ): Promise<{ data: RankedTeam[]; total: number }>;
}
