import { MatchStage, MatchStatus } from './match.enum';
import { PaginationQuery } from './pagination.model';

export interface MatchTeamSummary {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
}

export interface MatchStatistic {
  teamId: string;
  possession: number | null;
  shotsTotal: number | null;
  shotsOnTarget: number | null;
  corners: number | null;
  fouls: number | null;
  yellowCards: number | null;
  redCards: number | null;
  passes: number | null;
  passAccuracy: number | null;
  offsides: number | null;
}

export interface Match {
  id: string;
  competitionId: string;
  homeTeam: MatchTeamSummary;
  awayTeam: MatchTeamSummary;
  matchDate: string;
  venue: string | null;
  city: string | null;
  stage: MatchStage;
  round: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
  status: MatchStatus;
  statistics?: MatchStatistic[];
  createdAt: string;
  updatedAt: string;
}

export interface MatchQuery extends PaginationQuery {
  competitionId?: string;
  teamId?: string;
  status?: MatchStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateMatchRequest {
  competitionId: string;
  homeTeamId: string;
  awayTeamId: string;
  matchDate: string;
  venue?: string;
  city?: string;
  stage: MatchStage;
  round?: string;
  homeGoals?: number;
  awayGoals?: number;
  status?: MatchStatus;
}

export type UpdateMatchRequest = Partial<CreateMatchRequest>;

export interface UpsertMatchStatisticRequest {
  teamId: string;
  possession?: number;
  shotsTotal?: number;
  shotsOnTarget?: number;
  corners?: number;
  fouls?: number;
  yellowCards?: number;
  redCards?: number;
  passes?: number;
  passAccuracy?: number;
  offsides?: number;
}
