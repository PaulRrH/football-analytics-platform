import {
  Confederation,
  CompetitionType,
  MatchStage,
  MatchStatus,
} from '@prisma/client';

export const SPORTS_DATA_PROVIDER = 'SPORTS_DATA_PROVIDER';

export interface ExternalCompetition {
  externalId: string;
  name: string;
  type: CompetitionType;
  season: string;
  startDate: Date;
  endDate: Date;
}

export interface ExternalTeam {
  externalId: string;
  name: string;
  shortName: string;
  country: string;
  confederation: Confederation;
  logoUrl?: string;
}

export interface ExternalMatch {
  externalId: string;
  homeTeamExternalId: string;
  awayTeamExternalId: string;
  matchDate: Date;
  stage: MatchStage;
  round?: string;
  status: MatchStatus;
  homeGoals?: number;
  awayGoals?: number;
}

/**
 * Puerto (Adapter pattern) hacia proveedores externos de datos
 * deportivos (ver ARCHITECTURE.md §1). La implementacion concreta vive
 * en infrastructure/providers.
 */
export interface SportsDataProvider {
  getProviderName(): string;
  isConfigured(): boolean;
  getCompetitions(): Promise<ExternalCompetition[]>;
  getTeams(competitionExternalId: string): Promise<ExternalTeam[]>;
  getMatches(competitionExternalId: string): Promise<ExternalMatch[]>;
}
