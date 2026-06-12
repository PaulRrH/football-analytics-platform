import {
  Competition,
  CompetitionStatus,
  CompetitionType,
} from '@prisma/client';

export const COMPETITION_REPOSITORY = 'COMPETITION_REPOSITORY';

export interface CreateCompetitionData {
  name: string;
  type: CompetitionType;
  season: string;
  startDate: Date;
  endDate: Date;
  status?: CompetitionStatus;
}

export interface UpdateCompetitionData {
  name?: string;
  type?: CompetitionType;
  season?: string;
  startDate?: Date;
  endDate?: Date;
  status?: CompetitionStatus;
}

export interface FindAllCompetitionsParams {
  skip: number;
  take: number;
  type?: CompetitionType;
  status?: CompetitionStatus;
  season?: string;
  search?: string;
}

export interface CountCompetitionsParams {
  type?: CompetitionType;
  status?: CompetitionStatus;
  season?: string;
  search?: string;
}

/**
 * Puerto (Repository pattern) para el agregado Competition.
 * La implementacion concreta vive en infrastructure/repositories.
 */
export interface ICompetitionRepository {
  findAll(params: FindAllCompetitionsParams): Promise<Competition[]>;
  count(params: CountCompetitionsParams): Promise<number>;
  findById(id: string): Promise<Competition | null>;
  create(data: CreateCompetitionData): Promise<Competition>;
  update(id: string, data: UpdateCompetitionData): Promise<Competition>;
  delete(id: string): Promise<void>;
}
