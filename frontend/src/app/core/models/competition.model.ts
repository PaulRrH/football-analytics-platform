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
