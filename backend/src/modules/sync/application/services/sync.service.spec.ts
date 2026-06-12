import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  Competition,
  CompetitionStatus,
  CompetitionType,
  Confederation,
  Match,
  MatchStage,
  MatchStatus,
  Team,
} from '@prisma/client';
import {
  COMPETITION_REPOSITORY,
  ICompetitionRepository,
} from '../../../competitions/domain/competition-repository.interface';
import { EloRatingService } from '../../../teams/application/services/elo-rating.service';
import {
  ITeamRepository,
  TEAM_REPOSITORY,
} from '../../../teams/domain/team-repository.interface';
import {
  IMatchRepository,
  MATCH_REPOSITORY,
} from '../../../matches/domain/match-repository.interface';
import {
  SPORTS_DATA_PROVIDER,
  SportsDataProvider,
} from '../../domain/sports-data-provider.interface';
import { SyncService } from './sync.service';

describe('SyncService', () => {
  let service: SyncService;
  let provider: jest.Mocked<SportsDataProvider>;
  let competitionRepository: jest.Mocked<ICompetitionRepository>;
  let teamRepository: jest.Mocked<ITeamRepository>;
  let matchRepository: jest.Mocked<IMatchRepository>;
  let eloRatingService: jest.Mocked<EloRatingService>;

  const competition: Competition = {
    id: 'comp-1',
    name: 'FIFA World Cup',
    type: CompetitionType.WORLD_CUP,
    season: '2026',
    startDate: new Date('2026-06-11'),
    endDate: new Date('2026-07-19'),
    status: CompetitionStatus.UPCOMING,
    externalId: 'ext-comp-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const buildTeam = (overrides: Partial<Team>): Team => ({
    id: 'team-id',
    name: 'Team',
    shortName: 'TM',
    country: 'Country',
    confederation: Confederation.UEFA,
    logoUrl: null,
    fifaRanking: null,
    fifaRankingPoints: null,
    eloRating: 1500,
    foundedYear: null,
    externalId: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  });

  const buildMatch = (overrides: Partial<Match>): Match => ({
    id: 'match-1',
    competitionId: competition.id,
    homeTeamId: 'home-1',
    awayTeamId: 'away-1',
    matchDate: new Date('2026-06-11T18:00:00.000Z'),
    venue: null,
    city: null,
    stage: MatchStage.GROUP_STAGE,
    round: null,
    homeGoals: null,
    awayGoals: null,
    status: MatchStatus.SCHEDULED,
    externalId: 'ext-match-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  });

  beforeEach(async () => {
    provider = {
      getProviderName: jest.fn(),
      isConfigured: jest.fn(),
      getCompetitions: jest.fn(),
      getTeams: jest.fn(),
      getMatches: jest.fn(),
    };

    competitionRepository = {
      findAll: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      findByExternalId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findTeams: jest.fn(),
      findFinishedMatches: jest.fn(),
      upsertTeam: jest.fn(),
      removeTeam: jest.fn(),
    };

    teamRepository = {
      findAll: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findByExternalId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findRankingHistory: jest.fn(),
      recordRankingHistory: jest.fn(),
    };

    matchRepository = {
      findAll: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      findByExternalId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsertStatistic: jest.fn(),
    };

    eloRatingService = {
      applyMatchResult: jest.fn(),
    } as unknown as jest.Mocked<EloRatingService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: SPORTS_DATA_PROVIDER, useValue: provider },
        { provide: COMPETITION_REPOSITORY, useValue: competitionRepository },
        { provide: TEAM_REPOSITORY, useValue: teamRepository },
        { provide: MATCH_REPOSITORY, useValue: matchRepository },
        { provide: EloRatingService, useValue: eloRatingService },
      ],
    }).compile();

    service = module.get(SyncService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getStatus', () => {
    it('retorna el nombre y el estado de configuracion del proveedor activo', () => {
      provider.getProviderName.mockReturnValue('football-data.org');
      provider.isConfigured.mockReturnValue(true);

      expect(service.getStatus()).toEqual({
        provider: 'football-data.org',
        configured: true,
      });
    });
  });

  describe('syncCompetitions', () => {
    it('crea las competiciones nuevas y actualiza las ya vinculadas', async () => {
      provider.getCompetitions.mockResolvedValue([
        {
          externalId: 'ext-1',
          name: 'FIFA World Cup',
          type: CompetitionType.WORLD_CUP,
          season: '2026',
          startDate: new Date('2026-06-11'),
          endDate: new Date('2026-07-19'),
        },
        {
          externalId: 'ext-2',
          name: 'European Championship',
          type: CompetitionType.CONTINENTAL,
          season: '2024',
          startDate: new Date('2024-06-14'),
          endDate: new Date('2024-07-14'),
        },
      ]);

      competitionRepository.findByExternalId.mockImplementation((externalId) =>
        Promise.resolve(
          externalId === 'ext-2'
            ? { ...competition, id: 'comp-2', externalId: 'ext-2' }
            : null,
        ),
      );

      const result = await service.syncCompetitions();

      expect(competitionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          externalId: 'ext-1',
          name: 'FIFA World Cup',
        }),
      );
      expect(competitionRepository.update).toHaveBeenCalledWith(
        'comp-2',
        expect.objectContaining({ name: 'European Championship' }),
      );
      expect(result).toEqual({ created: 1, updated: 1, skipped: 0 });
    });
  });

  describe('syncTeams', () => {
    it('lanza NotFoundException cuando la competicion no existe', async () => {
      competitionRepository.findById.mockResolvedValue(null);

      await expect(service.syncTeams('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lanza BadRequestException cuando la competicion no esta vinculada', async () => {
      competitionRepository.findById.mockResolvedValue({
        ...competition,
        externalId: null,
      });

      await expect(service.syncTeams(competition.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(provider.getTeams).not.toHaveBeenCalled();
    });

    it('crea equipos nuevos, actualiza los existentes y los une a la competicion', async () => {
      competitionRepository.findById.mockResolvedValue(competition);
      provider.getTeams.mockResolvedValue([
        {
          externalId: 'team-ext-1',
          name: 'Argentina',
          shortName: 'ARG',
          country: 'Argentina',
          confederation: Confederation.CONMEBOL,
          logoUrl: 'https://crests.example/arg.png',
        },
        {
          externalId: 'team-ext-2',
          name: 'Brasil',
          shortName: 'BRA',
          country: 'Brazil',
          confederation: Confederation.CONMEBOL,
        },
      ]);

      teamRepository.findByExternalId.mockImplementation((externalId) =>
        Promise.resolve(
          externalId === 'team-ext-2'
            ? buildTeam({
                id: 'team-2',
                externalId: 'team-ext-2',
                name: 'Brasil',
              })
            : null,
        ),
      );
      teamRepository.create.mockResolvedValue(
        buildTeam({
          id: 'team-1',
          externalId: 'team-ext-1',
          name: 'Argentina',
        }),
      );
      teamRepository.update.mockResolvedValue(
        buildTeam({ id: 'team-2', externalId: 'team-ext-2', name: 'Brasil' }),
      );

      const result = await service.syncTeams(competition.id);

      expect(teamRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          externalId: 'team-ext-1',
          name: 'Argentina',
        }),
      );
      expect(teamRepository.update).toHaveBeenCalledWith(
        'team-2',
        expect.objectContaining({ name: 'Brasil' }),
      );
      expect(competitionRepository.upsertTeam).toHaveBeenCalledWith(
        competition.id,
        'team-1',
        {},
      );
      expect(competitionRepository.upsertTeam).toHaveBeenCalledWith(
        competition.id,
        'team-2',
        {},
      );
      expect(result).toEqual({ created: 1, updated: 1, skipped: 0 });
    });
  });

  describe('syncMatches', () => {
    it('lanza NotFoundException cuando la competicion no existe', async () => {
      competitionRepository.findById.mockResolvedValue(null);

      await expect(service.syncMatches('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lanza BadRequestException cuando la competicion no esta vinculada', async () => {
      competitionRepository.findById.mockResolvedValue({
        ...competition,
        externalId: null,
      });

      await expect(service.syncMatches(competition.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(provider.getMatches).not.toHaveBeenCalled();
    });

    it('omite partidos cuyos equipos aun no estan vinculados', async () => {
      competitionRepository.findById.mockResolvedValue(competition);
      provider.getMatches.mockResolvedValue([
        {
          externalId: 'ext-match-1',
          homeTeamExternalId: 'unknown-home',
          awayTeamExternalId: 'unknown-away',
          matchDate: new Date('2026-06-11T18:00:00.000Z'),
          stage: MatchStage.GROUP_STAGE,
          status: MatchStatus.SCHEDULED,
        },
      ]);
      teamRepository.findByExternalId.mockResolvedValue(null);

      const result = await service.syncMatches(competition.id);

      expect(matchRepository.create).not.toHaveBeenCalled();
      expect(matchRepository.update).not.toHaveBeenCalled();
      expect(result).toEqual({ created: 0, updated: 0, skipped: 1 });
    });

    it('crea un partido nuevo cuando no existe por externalId', async () => {
      const homeTeam = buildTeam({ id: 'home-1', externalId: 'home-ext' });
      const awayTeam = buildTeam({ id: 'away-1', externalId: 'away-ext' });

      competitionRepository.findById.mockResolvedValue(competition);
      provider.getMatches.mockResolvedValue([
        {
          externalId: 'ext-match-1',
          homeTeamExternalId: 'home-ext',
          awayTeamExternalId: 'away-ext',
          matchDate: new Date('2026-06-11T18:00:00.000Z'),
          stage: MatchStage.GROUP_STAGE,
          round: 'Group A',
          status: MatchStatus.SCHEDULED,
        },
      ]);
      teamRepository.findByExternalId.mockImplementation((externalId) =>
        Promise.resolve(
          externalId === 'home-ext'
            ? homeTeam
            : externalId === 'away-ext'
              ? awayTeam
              : null,
        ),
      );
      matchRepository.findByExternalId.mockResolvedValue(null);

      const result = await service.syncMatches(competition.id);

      expect(matchRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          competitionId: competition.id,
          homeTeamId: 'home-1',
          awayTeamId: 'away-1',
          externalId: 'ext-match-1',
          round: 'Group A',
        }),
      );
      expect(eloRatingService.applyMatchResult).not.toHaveBeenCalled();
      expect(result).toEqual({ created: 1, updated: 0, skipped: 0 });
    });

    it('actualiza un partido existente que pasa a FINISHED y recalcula el Elo', async () => {
      const homeTeam = buildTeam({ id: 'home-1', externalId: 'home-ext' });
      const awayTeam = buildTeam({ id: 'away-1', externalId: 'away-ext' });
      const existingMatch = buildMatch({ status: MatchStatus.SCHEDULED });

      competitionRepository.findById.mockResolvedValue(competition);
      provider.getMatches.mockResolvedValue([
        {
          externalId: existingMatch.externalId!,
          homeTeamExternalId: 'home-ext',
          awayTeamExternalId: 'away-ext',
          matchDate: existingMatch.matchDate,
          stage: MatchStage.GROUP_STAGE,
          status: MatchStatus.FINISHED,
          homeGoals: 2,
          awayGoals: 1,
        },
      ]);
      teamRepository.findByExternalId.mockImplementation((externalId) =>
        Promise.resolve(
          externalId === 'home-ext'
            ? homeTeam
            : externalId === 'away-ext'
              ? awayTeam
              : null,
        ),
      );
      matchRepository.findByExternalId.mockResolvedValue(existingMatch);

      const result = await service.syncMatches(competition.id);

      expect(matchRepository.update).toHaveBeenCalledWith(
        existingMatch.id,
        expect.objectContaining({
          status: MatchStatus.FINISHED,
          homeGoals: 2,
          awayGoals: 1,
        }),
      );
      expect(eloRatingService.applyMatchResult).toHaveBeenCalledWith(
        'home-1',
        'away-1',
        2,
        1,
        MatchStage.GROUP_STAGE,
      );
      expect(result).toEqual({ created: 0, updated: 1, skipped: 0 });
    });

    it('omite un partido existente sin cambios relevantes', async () => {
      const homeTeam = buildTeam({ id: 'home-1', externalId: 'home-ext' });
      const awayTeam = buildTeam({ id: 'away-1', externalId: 'away-ext' });
      const existingMatch = buildMatch({
        status: MatchStatus.FINISHED,
        homeGoals: 2,
        awayGoals: 1,
        round: 'Group A',
      });

      competitionRepository.findById.mockResolvedValue(competition);
      provider.getMatches.mockResolvedValue([
        {
          externalId: existingMatch.externalId!,
          homeTeamExternalId: 'home-ext',
          awayTeamExternalId: 'away-ext',
          matchDate: existingMatch.matchDate,
          stage: existingMatch.stage,
          round: 'Group A',
          status: MatchStatus.FINISHED,
          homeGoals: 2,
          awayGoals: 1,
        },
      ]);
      teamRepository.findByExternalId.mockImplementation((externalId) =>
        Promise.resolve(
          externalId === 'home-ext'
            ? homeTeam
            : externalId === 'away-ext'
              ? awayTeam
              : null,
        ),
      );
      matchRepository.findByExternalId.mockResolvedValue(existingMatch);

      const result = await service.syncMatches(competition.id);

      expect(matchRepository.update).not.toHaveBeenCalled();
      expect(eloRatingService.applyMatchResult).not.toHaveBeenCalled();
      expect(result).toEqual({ created: 0, updated: 0, skipped: 1 });
    });

    it('no recalcula el Elo si el partido ya estaba FINISHED', async () => {
      const homeTeam = buildTeam({ id: 'home-1', externalId: 'home-ext' });
      const awayTeam = buildTeam({ id: 'away-1', externalId: 'away-ext' });
      const existingMatch = buildMatch({
        status: MatchStatus.FINISHED,
        homeGoals: 2,
        awayGoals: 1,
      });

      competitionRepository.findById.mockResolvedValue(competition);
      provider.getMatches.mockResolvedValue([
        {
          externalId: existingMatch.externalId!,
          homeTeamExternalId: 'home-ext',
          awayTeamExternalId: 'away-ext',
          matchDate: existingMatch.matchDate,
          stage: existingMatch.stage,
          round: 'Group A (corregido)',
          status: MatchStatus.FINISHED,
          homeGoals: 2,
          awayGoals: 1,
        },
      ]);
      teamRepository.findByExternalId.mockImplementation((externalId) =>
        Promise.resolve(
          externalId === 'home-ext'
            ? homeTeam
            : externalId === 'away-ext'
              ? awayTeam
              : null,
        ),
      );
      matchRepository.findByExternalId.mockResolvedValue(existingMatch);

      const result = await service.syncMatches(competition.id);

      expect(matchRepository.update).toHaveBeenCalled();
      expect(eloRatingService.applyMatchResult).not.toHaveBeenCalled();
      expect(result).toEqual({ created: 0, updated: 1, skipped: 0 });
    });
  });
});
