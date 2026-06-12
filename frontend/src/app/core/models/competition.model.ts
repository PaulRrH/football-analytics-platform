import { CompetitionStatus, CompetitionType } from './competition.enum';
import { PaginationQuery } from './pagination.model';

export interface Competition {
  id: string;
  name: string;
  type: CompetitionType;
  season: string;
  startDate: string;
  endDate: string;
  status: CompetitionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CompetitionQuery extends PaginationQuery {
  type?: CompetitionType;
  status?: CompetitionStatus;
  season?: string;
  search?: string;
}

export interface CreateCompetitionRequest {
  name: string;
  type: CompetitionType;
  season: string;
  startDate: string;
  endDate: string;
  status?: CompetitionStatus;
}

export type UpdateCompetitionRequest = Partial<CreateCompetitionRequest>;

export interface StandingsTeam {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
}

export interface StandingsRow {
  team: StandingsTeam;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface StandingsGroup {
  groupName: string | null;
  standings: StandingsRow[];
}

export interface CompetitionTeam {
  teamId: string;
  groupName: string | null;
  seed: number | null;
  team: StandingsTeam;
}
