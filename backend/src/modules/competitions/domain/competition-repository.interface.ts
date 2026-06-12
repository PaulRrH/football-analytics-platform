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
  externalId?: string | null;
}

export interface UpdateCompetitionData {
  name?: string;
  type?: CompetitionType;
  season?: string;
  startDate?: Date;
  endDate?: Date;
  status?: CompetitionStatus;
  externalId?: string | null;
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

export interface StandingsTeamInfo {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
}

export interface CompetitionTeamWithTeam {
  teamId: string;
  groupName: string | null;
  seed?: number | null;
  team: StandingsTeamInfo;
}

export interface UpsertCompetitionTeamData {
  groupName?: string | null;
  seed?: number | null;
}

export interface FinishedMatchResult {
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
  homeTeam: StandingsTeamInfo;
  awayTeam: StandingsTeamInfo;
}

/**
 * Puerto (Repository pattern) para el agregado Competition.
 * La implementacion concreta vive en infrastructure/repositories.
 */
export interface ICompetitionRepository {
  findAll(params: FindAllCompetitionsParams): Promise<Competition[]>;
  count(params: CountCompetitionsParams): Promise<number>;
  findById(id: string): Promise<Competition | null>;
  findByExternalId(externalId: string): Promise<Competition | null>;
  create(data: CreateCompetitionData): Promise<Competition>;
  update(id: string, data: UpdateCompetitionData): Promise<Competition>;
  delete(id: string): Promise<void>;
  findTeams(competitionId: string): Promise<CompetitionTeamWithTeam[]>;
  findFinishedMatches(competitionId: string): Promise<FinishedMatchResult[]>;
  upsertTeam(
    competitionId: string,
    teamId: string,
    data: UpsertCompetitionTeamData,
  ): Promise<CompetitionTeamWithTeam>;
  removeTeam(competitionId: string, teamId: string): Promise<void>;
}
