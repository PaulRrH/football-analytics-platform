import { Confederation, Team, TeamRankingHistory } from '@prisma/client';

export const TEAM_REPOSITORY = 'TEAM_REPOSITORY';

export interface CreateTeamData {
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

export interface UpdateTeamData {
  name?: string;
  shortName?: string;
  country?: string;
  confederation?: Confederation;
  logoUrl?: string;
  fifaRanking?: number;
  fifaRankingPoints?: number;
  eloRating?: number;
  foundedYear?: number;
}

export interface FindAllTeamsParams {
  skip: number;
  take: number;
  confederation?: Confederation;
  search?: string;
}

export interface CountTeamsParams {
  confederation?: Confederation;
  search?: string;
}

/**
 * Puerto (Repository pattern) para el agregado Team.
 * La implementacion concreta vive en infrastructure/repositories.
 */
export interface ITeamRepository {
  findAll(params: FindAllTeamsParams): Promise<Team[]>;
  count(params: CountTeamsParams): Promise<number>;
  findById(id: string): Promise<Team | null>;
  findByName(name: string): Promise<Team | null>;
  create(data: CreateTeamData): Promise<Team>;
  update(id: string, data: UpdateTeamData): Promise<Team>;
  delete(id: string): Promise<void>;
  findRankingHistory(teamId: string): Promise<TeamRankingHistory[]>;
}
