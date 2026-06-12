import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Confederation, Team, TeamRankingHistory } from '@prisma/client';
import {
  ITeamRepository,
  TEAM_REPOSITORY,
} from '../../domain/team-repository.interface';
import { TeamsService } from './teams.service';

describe('TeamsService', () => {
  let service: TeamsService;
  let repository: jest.Mocked<ITeamRepository>;

  const team: Team = {
    id: 'team-1',
    name: 'Argentina',
    shortName: 'ARG',
    country: 'Argentina',
    confederation: Confederation.CONMEBOL,
    logoUrl: 'https://flagcdn.com/w320/ar.png',
    fifaRanking: 1,
    fifaRankingPoints: 1850.5,
    eloRating: 2100,
    foundedYear: 1893,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    repository = {
      findAll: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findRankingHistory: jest.fn(),
      recordRankingHistory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: TEAM_REPOSITORY, useValue: repository },
      ],
    }).compile();

    service = module.get(TeamsService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('crea un equipo cuando el nombre no esta en uso', async () => {
      repository.findByName.mockResolvedValue(null);
      repository.create.mockResolvedValue(team);

      const result = await service.create({
        name: 'Argentina',
        shortName: 'ARG',
        country: 'Argentina',
        confederation: Confederation.CONMEBOL,
      });

      expect(repository.create).toHaveBeenCalled();
      expect(result.id).toBe(team.id);
      expect(result.name).toBe('Argentina');
    });

    it('lanza ConflictException si el nombre ya existe', async () => {
      repository.findByName.mockResolvedValue(team);

      await expect(
        service.create({
          name: 'Argentina',
          shortName: 'ARG',
          country: 'Argentina',
          confederation: Confederation.CONMEBOL,
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('retorna una respuesta paginada', async () => {
      repository.findAll.mockResolvedValue([team]);
      repository.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(team.id);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(repository.findAll).toHaveBeenCalledWith({ skip: 0, take: 10 });
    });
  });

  describe('findOne', () => {
    it('retorna el equipo cuando existe', async () => {
      repository.findById.mockResolvedValue(team);

      const result = await service.findOne(team.id);

      expect(result.id).toBe(team.id);
    });

    it('lanza NotFoundException cuando no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('actualiza el equipo cuando existe y el nombre no colisiona', async () => {
      repository.findById.mockResolvedValue(team);
      repository.findByName.mockResolvedValue(null);
      repository.update.mockResolvedValue({ ...team, eloRating: 2150 });

      const result = await service.update(team.id, { eloRating: 2150 });

      expect(result.eloRating).toBe(2150);
      expect(repository.update).toHaveBeenCalledWith(team.id, {
        eloRating: 2150,
      });
    });

    it('lanza NotFoundException cuando el equipo no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update('missing', { eloRating: 2000 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lanza ConflictException si el nuevo nombre pertenece a otro equipo', async () => {
      repository.findById.mockResolvedValue(team);
      repository.findByName.mockResolvedValue({ ...team, id: 'other-team' });

      await expect(
        service.update(team.id, { name: 'Brasil' }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('elimina el equipo cuando existe', async () => {
      repository.findById.mockResolvedValue(team);

      await service.remove(team.id);

      expect(repository.delete).toHaveBeenCalledWith(team.id);
    });

    it('lanza NotFoundException cuando no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getRankingHistory', () => {
    it('retorna el historial del equipo', async () => {
      const history: TeamRankingHistory[] = [
        {
          id: 'history-1',
          teamId: team.id,
          fifaRanking: 1,
          fifaPoints: 1850.5,
          eloRating: 2100,
          recordedAt: new Date('2025-01-01'),
        },
      ];
      repository.findById.mockResolvedValue(team);
      repository.findRankingHistory.mockResolvedValue(history);

      const result = await service.getRankingHistory(team.id);

      expect(result).toHaveLength(1);
      expect(result[0].eloRating).toBe(2100);
    });

    it('lanza NotFoundException cuando el equipo no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getRankingHistory('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
