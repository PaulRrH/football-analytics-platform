import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Confederation, MatchStage, MatchStatus } from '@prisma/client';
import { EloRatingService } from '../../../teams/application/services/elo-rating.service';
import {
  IMatchRepository,
  MATCH_REPOSITORY,
  MatchListItem,
  MatchWithRelations,
} from '../../domain/match-repository.interface';
import { MatchesService } from './matches.service';

describe('MatchesService', () => {
  let service: MatchesService;
  let repository: jest.Mocked<IMatchRepository>;
  let eloRatingService: jest.Mocked<EloRatingService>;

  const homeTeam = {
    id: 'team-home',
    name: 'Argentina',
    shortName: 'ARG',
    country: 'Argentina',
    confederation: Confederation.CONMEBOL,
    logoUrl: null,
    fifaRanking: 1,
    fifaRankingPoints: 1850.5,
    eloRating: 2100,
    foundedYear: 1893,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const awayTeam = {
    ...homeTeam,
    id: 'team-away',
    name: 'Brasil',
    shortName: 'BRA',
  };

  const baseMatch = {
    id: 'match-1',
    competitionId: 'comp-1',
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    matchDate: new Date('2026-06-11T18:00:00.000Z'),
    venue: 'Estadio Azteca',
    city: 'Ciudad de Mexico',
    stage: MatchStage.GROUP_STAGE,
    round: 'Jornada 1',
    homeGoals: null,
    awayGoals: null,
    status: MatchStatus.SCHEDULED,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const matchListItem: MatchListItem = { ...baseMatch, homeTeam, awayTeam };
  const matchWithRelations: MatchWithRelations = {
    ...baseMatch,
    homeTeam,
    awayTeam,
    statistics: [],
  };

  beforeEach(async () => {
    repository = {
      findAll: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
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
        MatchesService,
        { provide: MATCH_REPOSITORY, useValue: repository },
        { provide: EloRatingService, useValue: eloRatingService },
      ],
    }).compile();

    service = module.get(MatchesService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('crea un partido cuando los equipos son distintos', async () => {
      repository.create.mockResolvedValue(baseMatch);
      repository.findById.mockResolvedValue(matchWithRelations);

      const result = await service.create({
        competitionId: 'comp-1',
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        matchDate: '2026-06-11T18:00:00.000Z',
        stage: MatchStage.GROUP_STAGE,
      });

      expect(result.id).toBe(baseMatch.id);
      expect(result.homeTeam.id).toBe(homeTeam.id);
    });

    it('lanza BadRequestException si el equipo local y visitante son iguales', async () => {
      await expect(
        service.create({
          competitionId: 'comp-1',
          homeTeamId: homeTeam.id,
          awayTeamId: homeTeam.id,
          matchDate: '2026-06-11T18:00:00.000Z',
          stage: MatchStage.GROUP_STAGE,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('retorna una respuesta paginada', async () => {
      repository.findAll.mockResolvedValue([matchListItem]);
      repository.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(baseMatch.id);
      expect(result.data[0].statistics).toBeUndefined();
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('findOne', () => {
    it('retorna el partido con sus estadisticas cuando existe', async () => {
      repository.findById.mockResolvedValue(matchWithRelations);

      const result = await service.findOne(baseMatch.id);

      expect(result.id).toBe(baseMatch.id);
      expect(result.statistics).toEqual([]);
    });

    it('lanza NotFoundException cuando no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('actualiza el partido cuando existe y los equipos siguen siendo distintos', async () => {
      repository.findById.mockResolvedValue(matchWithRelations);
      repository.update.mockResolvedValue({
        ...baseMatch,
        status: MatchStatus.LIVE,
      });

      const result = await service.update(baseMatch.id, {
        status: MatchStatus.LIVE,
      });

      expect(repository.update).toHaveBeenCalledWith(baseMatch.id, {
        status: MatchStatus.LIVE,
        matchDate: undefined,
      });
      expect(result.id).toBe(baseMatch.id);
    });

    it('lanza NotFoundException cuando el partido no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update('missing', { status: MatchStatus.LIVE }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lanza BadRequestException si el cambio deja equipos iguales', async () => {
      repository.findById.mockResolvedValue(matchWithRelations);

      await expect(
        service.update(baseMatch.id, { awayTeamId: homeTeam.id }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('recalcula el Elo cuando el partido pasa a FINISHED con goles', async () => {
      repository.findById.mockResolvedValue(matchWithRelations);
      repository.update.mockResolvedValue({
        ...baseMatch,
        status: MatchStatus.FINISHED,
        homeGoals: 2,
        awayGoals: 1,
      });

      await service.update(baseMatch.id, {
        status: MatchStatus.FINISHED,
        homeGoals: 2,
        awayGoals: 1,
      });

      expect(eloRatingService.applyMatchResult).toHaveBeenCalledWith(
        homeTeam.id,
        awayTeam.id,
        2,
        1,
        MatchStage.GROUP_STAGE,
      );
    });

    it('no recalcula el Elo si el partido ya estaba FINISHED', async () => {
      const finishedMatch: MatchWithRelations = {
        ...matchWithRelations,
        status: MatchStatus.FINISHED,
        homeGoals: 1,
        awayGoals: 0,
      };
      repository.findById.mockResolvedValue(finishedMatch);
      repository.update.mockResolvedValue({
        ...baseMatch,
        status: MatchStatus.FINISHED,
        homeGoals: 2,
        awayGoals: 1,
      });

      await service.update(baseMatch.id, {
        status: MatchStatus.FINISHED,
        homeGoals: 2,
        awayGoals: 1,
      });

      expect(eloRatingService.applyMatchResult).not.toHaveBeenCalled();
    });

    it('no recalcula el Elo si pasa a FINISHED sin goles', async () => {
      repository.findById.mockResolvedValue(matchWithRelations);
      repository.update.mockResolvedValue({
        ...baseMatch,
        status: MatchStatus.FINISHED,
      });

      await service.update(baseMatch.id, {
        status: MatchStatus.FINISHED,
      });

      expect(eloRatingService.applyMatchResult).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('elimina el partido cuando existe', async () => {
      repository.findById.mockResolvedValue(matchWithRelations);

      await service.remove(baseMatch.id);

      expect(repository.delete).toHaveBeenCalledWith(baseMatch.id);
    });

    it('lanza NotFoundException cuando no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('upsertStatistic', () => {
    it('actualiza las estadisticas cuando el equipo participa en el partido', async () => {
      repository.findById.mockResolvedValue(matchWithRelations);
      repository.upsertStatistic.mockResolvedValue({
        id: 'stat-1',
        matchId: baseMatch.id,
        teamId: homeTeam.id,
        possession: 58.4,
        shotsTotal: 12,
        shotsOnTarget: 5,
        corners: 6,
        fouls: 10,
        yellowCards: 2,
        redCards: 0,
        passes: 480,
        passAccuracy: 87.2,
        offsides: 1,
      });

      const result = await service.upsertStatistic(baseMatch.id, {
        teamId: homeTeam.id,
        possession: 58.4,
      });

      expect(result.teamId).toBe(homeTeam.id);
      expect(result.possession).toBe(58.4);
    });

    it('lanza BadRequestException si el equipo no participa en el partido', async () => {
      repository.findById.mockResolvedValue(matchWithRelations);

      await expect(
        service.upsertStatistic(baseMatch.id, { teamId: 'team-other' }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(repository.upsertStatistic).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException cuando el partido no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.upsertStatistic('missing', { teamId: homeTeam.id }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
