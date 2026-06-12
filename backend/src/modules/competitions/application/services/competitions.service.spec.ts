import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  Competition,
  CompetitionStatus,
  CompetitionType,
} from '@prisma/client';
import {
  COMPETITION_REPOSITORY,
  ICompetitionRepository,
} from '../../domain/competition-repository.interface';
import { CompetitionsService } from './competitions.service';

describe('CompetitionsService', () => {
  let service: CompetitionsService;
  let repository: jest.Mocked<ICompetitionRepository>;

  const competition: Competition = {
    id: 'competition-1',
    name: 'FIFA World Cup 2026',
    type: CompetitionType.WORLD_CUP,
    season: '2026',
    startDate: new Date('2026-06-11'),
    endDate: new Date('2026-07-19'),
    status: CompetitionStatus.UPCOMING,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    repository = {
      findAll: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompetitionsService,
        { provide: COMPETITION_REPOSITORY, useValue: repository },
      ],
    }).compile();

    service = module.get(CompetitionsService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('crea una competicion cuando el rango de fechas es valido', async () => {
      repository.create.mockResolvedValue(competition);

      const result = await service.create({
        name: 'FIFA World Cup 2026',
        type: CompetitionType.WORLD_CUP,
        season: '2026',
        startDate: '2026-06-11',
        endDate: '2026-07-19',
      });

      expect(repository.create).toHaveBeenCalled();
      expect(result.id).toBe(competition.id);
      expect(result.name).toBe('FIFA World Cup 2026');
    });

    it('lanza BadRequestException si startDate no es anterior a endDate', async () => {
      await expect(
        service.create({
          name: 'FIFA World Cup 2026',
          type: CompetitionType.WORLD_CUP,
          season: '2026',
          startDate: '2026-07-19',
          endDate: '2026-06-11',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('retorna una respuesta paginada', async () => {
      repository.findAll.mockResolvedValue([competition]);
      repository.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(competition.id);
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
    it('retorna la competicion cuando existe', async () => {
      repository.findById.mockResolvedValue(competition);

      const result = await service.findOne(competition.id);

      expect(result.id).toBe(competition.id);
    });

    it('lanza NotFoundException cuando no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('actualiza la competicion cuando existe y el rango de fechas es valido', async () => {
      repository.findById.mockResolvedValue(competition);
      repository.update.mockResolvedValue({
        ...competition,
        status: CompetitionStatus.ONGOING,
      });

      const result = await service.update(competition.id, {
        status: CompetitionStatus.ONGOING,
      });

      expect(result.status).toBe(CompetitionStatus.ONGOING);
      expect(repository.update).toHaveBeenCalledWith(competition.id, {
        status: CompetitionStatus.ONGOING,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('lanza NotFoundException cuando la competicion no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update('missing', { status: CompetitionStatus.ONGOING }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lanza BadRequestException si el nuevo rango de fechas es invalido', async () => {
      repository.findById.mockResolvedValue(competition);

      await expect(
        service.update(competition.id, { startDate: '2026-08-01' }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('elimina la competicion cuando existe', async () => {
      repository.findById.mockResolvedValue(competition);

      await service.remove(competition.id);

      expect(repository.delete).toHaveBeenCalledWith(competition.id);
    });

    it('lanza NotFoundException cuando no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
