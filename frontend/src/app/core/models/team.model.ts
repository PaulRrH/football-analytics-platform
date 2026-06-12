import { Confederation } from './confederation.enum';
import { PaginationQuery } from './pagination.model';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  country: string;
  confederation: Confederation;
  logoUrl: string | null;
  fifaRanking: number | null;
  fifaRankingPoints: number | null;
  eloRating: number;
  foundedYear: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamRankingHistoryEntry {
  id: string;
  fifaRanking: number | null;
  fifaPoints: number | null;
  eloRating: number;
  recordedAt: string;
}

export interface TeamQuery extends PaginationQuery {
  confederation?: Confederation;
  search?: string;
}

export interface CreateTeamRequest {
  name: string;
  shortName: string;
  country: string;
  confederation: Confederation;
  logoUrl?: string;
  fifaRanking?: number;
  fifaRankingPoints?: number;
  eloRating?: number;
  foundedYear?: number;
}

export type UpdateTeamRequest = Partial<CreateTeamRequest>;
