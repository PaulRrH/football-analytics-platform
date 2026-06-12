import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CompetitionType, MatchStage, MatchStatus } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import { mapCountryToConfederation } from '../../../../common/utils/country-confederation.util';
import { AppConfig } from '../../../../config/configuration';
import {
  ExternalCompetition,
  ExternalMatch,
  ExternalTeam,
  SportsDataProvider,
} from '../../domain/sports-data-provider.interface';

interface FootballDataArea {
  name: string;
}

interface FootballDataCompetition {
  id: number;
  name: string;
  code?: string;
  type?: string;
  area?: FootballDataArea;
  currentSeason: {
    startDate: string;
    endDate: string;
  };
}

interface FootballDataCompetitionsResponse {
  competitions: FootballDataCompetition[];
}

interface FootballDataTeam {
  id: number;
  name: string;
  tla?: string;
  area?: FootballDataArea;
  crest?: string;
}

interface FootballDataTeamsResponse {
  teams: FootballDataTeam[];
}

interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: string;
  stage?: string;
  group?: string | null;
  matchday?: number | null;
  homeTeam: { id: number };
  awayTeam: { id: number };
  score: {
    fullTime: {
      home: number | null;
      away: number | null;
    };
  };
}

interface FootballDataMatchesResponse {
  matches: FootballDataMatch[];
}

const MATCH_STATUS_MAP: Record<string, MatchStatus> = {
  SCHEDULED: MatchStatus.SCHEDULED,
  TIMED: MatchStatus.SCHEDULED,
  IN_PLAY: MatchStatus.LIVE,
  PAUSED: MatchStatus.LIVE,
  FINISHED: MatchStatus.FINISHED,
  AWARDED: MatchStatus.FINISHED,
  POSTPONED: MatchStatus.POSTPONED,
  SUSPENDED: MatchStatus.CANCELLED,
  CANCELLED: MatchStatus.CANCELLED,
};

const MATCH_STAGE_MAP: Record<string, MatchStage> = {
  LAST_16: MatchStage.ROUND_OF_16,
  QUARTER_FINALS: MatchStage.QUARTER_FINAL,
  SEMI_FINALS: MatchStage.SEMI_FINAL,
  FINAL: MatchStage.FINAL,
  THIRD_PLACE: MatchStage.THIRD_PLACE,
};

/**
 * Adaptador concreto del puerto SportsDataProvider para
 * football-data.org v4 (tier gratuito).
 */
@Injectable()
export class FootballDataProvider implements SportsDataProvider {
  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly http: HttpService,
  ) {}

  getProviderName(): string {
    return 'football-data.org';
  }

  isConfigured(): boolean {
    return Boolean(
      this.config.get('externalApi.footballData.apiKey', { infer: true }),
    );
  }

  async getCompetitions(): Promise<ExternalCompetition[]> {
    const { data } = await firstValueFrom(
      this.http.get<FootballDataCompetitionsResponse>(
        `${this.baseUrl()}/competitions`,
        { headers: this.headers() },
      ),
    );

    return data.competitions.map((competition) => ({
      externalId: String(competition.id),
      name: competition.name,
      type: this.mapCompetitionType(competition),
      season: this.buildSeason(
        competition.currentSeason.startDate,
        competition.currentSeason.endDate,
      ),
      startDate: new Date(competition.currentSeason.startDate),
      endDate: new Date(competition.currentSeason.endDate),
    }));
  }

  async getTeams(competitionExternalId: string): Promise<ExternalTeam[]> {
    const { data } = await firstValueFrom(
      this.http.get<FootballDataTeamsResponse>(
        `${this.baseUrl()}/competitions/${competitionExternalId}/teams`,
        { headers: this.headers() },
      ),
    );

    return data.teams.map((team) => ({
      externalId: String(team.id),
      name: team.name,
      shortName: this.deriveShortName(team.name, team.tla),
      country: team.area?.name ?? '',
      confederation: mapCountryToConfederation(team.area?.name ?? ''),
      logoUrl: team.crest,
    }));
  }

  async getMatches(competitionExternalId: string): Promise<ExternalMatch[]> {
    const { data } = await firstValueFrom(
      this.http.get<FootballDataMatchesResponse>(
        `${this.baseUrl()}/competitions/${competitionExternalId}/matches`,
        { headers: this.headers() },
      ),
    );

    return data.matches.map((match) => ({
      externalId: String(match.id),
      homeTeamExternalId: String(match.homeTeam.id),
      awayTeamExternalId: String(match.awayTeam.id),
      matchDate: new Date(match.utcDate),
      stage: this.mapMatchStage(match.stage),
      round:
        match.group ??
        (match.matchday ? `Jornada ${match.matchday}` : undefined),
      status: this.mapMatchStatus(match.status),
      homeGoals: match.score.fullTime.home ?? undefined,
      awayGoals: match.score.fullTime.away ?? undefined,
    }));
  }

  private mapCompetitionType(
    competition: FootballDataCompetition,
  ): CompetitionType {
    if (competition.code === 'WC') {
      return CompetitionType.WORLD_CUP;
    }
    if (
      competition.area?.name === 'Europe' &&
      competition.type === 'CUP' &&
      competition.code !== 'CL'
    ) {
      return CompetitionType.CONTINENTAL;
    }
    return CompetitionType.CLUB;
  }

  private mapMatchStatus(status: string): MatchStatus {
    return MATCH_STATUS_MAP[status] ?? MatchStatus.SCHEDULED;
  }

  private mapMatchStage(stage?: string): MatchStage {
    return (
      (stage ? MATCH_STAGE_MAP[stage] : undefined) ?? MatchStage.GROUP_STAGE
    );
  }

  private buildSeason(startDate: string, endDate: string): string {
    const startYear = new Date(startDate).getUTCFullYear();
    const endYear = new Date(endDate).getUTCFullYear();
    return startYear === endYear ? `${startYear}` : `${startYear}-${endYear}`;
  }

  private deriveShortName(name: string, tla?: string): string {
    if (tla && tla.length === 3) {
      return tla.toUpperCase();
    }
    const letters = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
    return letters.padEnd(3, 'X').slice(0, 3);
  }

  private headers(): Record<string, string> {
    return {
      'X-Auth-Token': this.config.get('externalApi.footballData.apiKey', {
        infer: true,
      }),
    };
  }

  private baseUrl(): string {
    return this.config.get('externalApi.footballData.baseUrl', {
      infer: true,
    });
  }
}
