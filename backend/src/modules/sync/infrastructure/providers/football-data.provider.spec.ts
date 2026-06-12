import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  CompetitionType,
  Confederation,
  MatchStage,
  MatchStatus,
} from '@prisma/client';
import { of } from 'rxjs';
import { AppConfig } from '../../../../config/configuration';
import { FootballDataProvider } from './football-data.provider';

describe('FootballDataProvider', () => {
  let provider: FootballDataProvider;
  let http: { get: jest.Mock };
  let config: ConfigService<AppConfig, true>;

  beforeEach(() => {
    http = { get: jest.fn() };
    config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          'externalApi.footballData.apiKey': 'test-api-key',
          'externalApi.footballData.baseUrl':
            'https://api.football-data.org/v4',
        };
        return values[key];
      }),
    } as unknown as ConfigService<AppConfig, true>;

    provider = new FootballDataProvider(config, http as unknown as HttpService);
  });

  it('se identifica como football-data.org', () => {
    expect(provider.getProviderName()).toBe('football-data.org');
  });

  it('isConfigured es true cuando hay apiKey y false cuando no', () => {
    expect(provider.isConfigured()).toBe(true);

    const unconfigured = new FootballDataProvider(
      {
        get: jest.fn().mockReturnValue(''),
      } as unknown as ConfigService<AppConfig, true>,
      http as unknown as HttpService,
    );
    expect(unconfigured.isConfigured()).toBe(false);
  });

  describe('getCompetitions', () => {
    it('mapea competiciones al tipo, temporada y fechas correctos', async () => {
      http.get.mockReturnValue(
        of({
          data: {
            competitions: [
              {
                id: 2000,
                name: 'FIFA World Cup',
                code: 'WC',
                type: 'CUP',
                area: { name: 'World' },
                currentSeason: {
                  startDate: '2026-06-11',
                  endDate: '2026-07-19',
                },
              },
              {
                id: 2018,
                name: 'European Championship',
                code: 'EC',
                type: 'CUP',
                area: { name: 'Europe' },
                currentSeason: {
                  startDate: '2024-06-14',
                  endDate: '2024-07-14',
                },
              },
              {
                id: 2021,
                name: 'Premier League',
                code: 'PL',
                type: 'LEAGUE',
                area: { name: 'England' },
                currentSeason: {
                  startDate: '2025-08-01',
                  endDate: '2026-05-24',
                },
              },
            ],
          },
        }),
      );

      const result = await provider.getCompetitions();

      expect(result).toEqual([
        {
          externalId: '2000',
          name: 'FIFA World Cup',
          type: CompetitionType.WORLD_CUP,
          season: '2026',
          startDate: new Date('2026-06-11'),
          endDate: new Date('2026-07-19'),
        },
        {
          externalId: '2018',
          name: 'European Championship',
          type: CompetitionType.CONTINENTAL,
          season: '2024',
          startDate: new Date('2024-06-14'),
          endDate: new Date('2024-07-14'),
        },
        {
          externalId: '2021',
          name: 'Premier League',
          type: CompetitionType.CLUB,
          season: '2025-2026',
          startDate: new Date('2025-08-01'),
          endDate: new Date('2026-05-24'),
        },
      ]);

      expect(http.get).toHaveBeenCalledWith(
        'https://api.football-data.org/v4/competitions',
        { headers: { 'X-Auth-Token': 'test-api-key' } },
      );
    });
  });

  describe('getTeams', () => {
    it('mapea equipos usando tla o derivando shortName y la confederacion por pais', async () => {
      http.get.mockReturnValue(
        of({
          data: {
            teams: [
              {
                id: 1,
                name: 'Argentina',
                tla: 'ARG',
                area: { name: 'Argentina' },
                crest: 'https://crests.example/arg.png',
              },
              {
                id: 2,
                name: 'Deutschland',
                area: { name: 'Germany' },
                crest: 'https://crests.example/ger.png',
              },
            ],
          },
        }),
      );

      const result = await provider.getTeams('2000');

      expect(result).toEqual([
        {
          externalId: '1',
          name: 'Argentina',
          shortName: 'ARG',
          country: 'Argentina',
          confederation: Confederation.CONMEBOL,
          logoUrl: 'https://crests.example/arg.png',
        },
        {
          externalId: '2',
          name: 'Deutschland',
          shortName: 'DEU',
          country: 'Germany',
          confederation: Confederation.UEFA,
          logoUrl: 'https://crests.example/ger.png',
        },
      ]);

      expect(http.get).toHaveBeenCalledWith(
        'https://api.football-data.org/v4/competitions/2000/teams',
        { headers: { 'X-Auth-Token': 'test-api-key' } },
      );
    });
  });

  describe('getMatches', () => {
    it('mapea partidos: estado, etapa, ronda y goles', async () => {
      http.get.mockReturnValue(
        of({
          data: {
            matches: [
              {
                id: 100,
                utcDate: '2026-06-11T18:00:00Z',
                status: 'SCHEDULED',
                stage: 'GROUP_STAGE',
                group: 'Group A',
                matchday: 1,
                homeTeam: { id: 1 },
                awayTeam: { id: 2 },
                score: { fullTime: { home: null, away: null } },
              },
              {
                id: 101,
                utcDate: '2026-06-15T18:00:00Z',
                status: 'FINISHED',
                stage: 'LAST_16',
                group: null,
                matchday: null,
                homeTeam: { id: 1 },
                awayTeam: { id: 2 },
                score: { fullTime: { home: 2, away: 1 } },
              },
              {
                id: 102,
                utcDate: '2026-06-20T18:00:00Z',
                status: 'IN_PLAY',
                group: null,
                matchday: 5,
                homeTeam: { id: 2 },
                awayTeam: { id: 1 },
                score: { fullTime: { home: 1, away: 1 } },
              },
            ],
          },
        }),
      );

      const result = await provider.getMatches('2000');

      expect(result).toEqual([
        {
          externalId: '100',
          homeTeamExternalId: '1',
          awayTeamExternalId: '2',
          matchDate: new Date('2026-06-11T18:00:00Z'),
          stage: MatchStage.GROUP_STAGE,
          round: 'Group A',
          status: MatchStatus.SCHEDULED,
          homeGoals: undefined,
          awayGoals: undefined,
        },
        {
          externalId: '101',
          homeTeamExternalId: '1',
          awayTeamExternalId: '2',
          matchDate: new Date('2026-06-15T18:00:00Z'),
          stage: MatchStage.ROUND_OF_16,
          round: undefined,
          status: MatchStatus.FINISHED,
          homeGoals: 2,
          awayGoals: 1,
        },
        {
          externalId: '102',
          homeTeamExternalId: '2',
          awayTeamExternalId: '1',
          matchDate: new Date('2026-06-20T18:00:00Z'),
          stage: MatchStage.GROUP_STAGE,
          round: 'Jornada 5',
          status: MatchStatus.LIVE,
          homeGoals: 1,
          awayGoals: 1,
        },
      ]);
    });
  });
});
