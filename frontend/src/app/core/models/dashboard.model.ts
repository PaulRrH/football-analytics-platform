import { Confederation } from './confederation.enum';
import { MatchStage } from './match.enum';
import { MatchTeamSummary } from './match.model';

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

export interface DashboardTeamSummary {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
  eloRating: number;
  fifaRanking: number | null;
}

export interface DashboardMatchSummary {
  id: string;
  matchDate: string;
  stage: MatchStage;
  homeGoals: number | null;
  awayGoals: number | null;
  homeTeam: MatchTeamSummary;
  awayTeam: MatchTeamSummary;
  competition: { id: string; name: string };
}

export interface DashboardSummary {
  counts: DashboardCounts;
  matchesByStatus: DashboardMatchesByStatus;
  topTeams: DashboardTeamSummary[];
  upcomingMatches: DashboardMatchSummary[];
  recentResults: DashboardMatchSummary[];
}

export interface DashboardRanking {
  rank: number;
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
  confederation: Confederation;
  eloRating: number;
  fifaRanking: number | null;
}
