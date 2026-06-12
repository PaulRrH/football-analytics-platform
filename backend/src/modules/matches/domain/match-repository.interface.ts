import {
  Match,
  MatchStage,
  MatchStatistic,
  MatchStatus,
  Prisma,
} from '@prisma/client';

export const MATCH_REPOSITORY = 'MATCH_REPOSITORY';

export const MATCH_LIST_INCLUDE = {
  homeTeam: true,
  awayTeam: true,
} as const;

export const MATCH_DETAIL_INCLUDE = {
  homeTeam: true,
  awayTeam: true,
  statistics: true,
} as const;

export type MatchListItem = Prisma.MatchGetPayload<{
  include: typeof MATCH_LIST_INCLUDE;
}>;
export type MatchWithRelations = Prisma.MatchGetPayload<{
  include: typeof MATCH_DETAIL_INCLUDE;
}>;

export interface CreateMatchData {
  competitionId: string;
  homeTeamId: string;
  awayTeamId: string;
  matchDate: Date;
  venue?: string;
  city?: string;
  stage: MatchStage;
  round?: string;
  homeGoals?: number;
  awayGoals?: number;
  status?: MatchStatus;
}

export interface UpdateMatchData {
  competitionId?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  matchDate?: Date;
  venue?: string;
  city?: string;
  stage?: MatchStage;
  round?: string;
  homeGoals?: number;
  awayGoals?: number;
  status?: MatchStatus;
}

export interface FindAllMatchesParams {
  skip: number;
  take: number;
  competitionId?: string;
  teamId?: string;
  status?: MatchStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CountMatchesParams {
  competitionId?: string;
  teamId?: string;
  status?: MatchStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface UpsertMatchStatisticData {
  matchId: string;
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

/**
 * Puerto (Repository pattern) para el agregado Match y sus estadisticas.
 * La implementacion concreta vive en infrastructure/repositories.
 */
export interface IMatchRepository {
  findAll(params: FindAllMatchesParams): Promise<MatchListItem[]>;
  count(params: CountMatchesParams): Promise<number>;
  findById(id: string): Promise<MatchWithRelations | null>;
  create(data: CreateMatchData): Promise<Match>;
  update(id: string, data: UpdateMatchData): Promise<Match>;
  delete(id: string): Promise<void>;
  upsertStatistic(data: UpsertMatchStatisticData): Promise<MatchStatistic>;
}
