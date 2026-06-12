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
      findByExternalId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findTeams: jest.fn(),
      findFinishedMatches: jest.fn(),
      upsertTeam: jest.fn(),
      removeTeam: jest.fn(),
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

  describe('getStandings', () => {
    const argentina = {
      id: 'team-arg',
      name: 'Argentina',
      shortName: 'ARG',
      logoUrl: null,
    };
    const brasil = {
      id: 'team-bra',
      name: 'Brasil',
      shortName: 'BRA',
      logoUrl: null,
    };
    const francia = {
      id: 'team-fra',
      name: 'Francia',
      shortName: 'FRA',
      logoUrl: null,
    };

    it('lanza NotFoundException cuando la competicion no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getStandings('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('calcula la tabla por grupos usando CompetitionTeam', async () => {
      repository.findById.mockResolvedValue(competition);
      repository.findTeams.mockResolvedValue([
        { teamId: argentina.id, groupName: 'Grupo A', team: argentina },
        { teamId: brasil.id, groupName: 'Grupo A', team: brasil },
        { teamId: francia.id, groupName: 'Grupo B', team: francia },
      ]);
      repository.findFinishedMatches.mockResolvedValue([
        {
          homeTeamId: argentina.id,
          awayTeamId: brasil.id,
          homeGoals: 2,
          awayGoals: 1,
          homeTeam: argentina,
          awayTeam: brasil,
        },
      ]);

      const result = await service.getStandings(competition.id);

      expect(result).toHaveLength(2);

      const groupA = result.find((g) => g.groupName === 'Grupo A');
      expect(groupA?.standings[0]).toMatchObject({
        team: { id: argentina.id },
        played: 1,
        won: 1,
        drawn: 0,
        lost: 0,
        goalsFor: 2,
        goalsAgainst: 1,
        goalDifference: 1,
        points: 3,
      });
      expect(groupA?.standings[1]).toMatchObject({
        team: { id: brasil.id },
        played: 1,
        won: 0,
        drawn: 0,
        lost: 1,
        goalsFor: 1,
        goalsAgainst: 2,
        goalDifference: -1,
        points: 0,
      });

      const groupB = result.find((g) => g.groupName === 'Grupo B');
      expect(groupB?.standings[0]).toMatchObject({
        team: { id: francia.id },
        played: 0,
        points: 0,
      });
    });

    it('genera una tabla general cuando no hay equipos registrados', async () => {
      repository.findById.mockResolvedValue(competition);
      repository.findTeams.mockResolvedValue([]);
      repository.findFinishedMatches.mockResolvedValue([
        {
          homeTeamId: argentina.id,
          awayTeamId: brasil.id,
          homeGoals: 2,
          awayGoals: 1,
          homeTeam: argentina,
          awayTeam: brasil,
        },
        {
          homeTeamId: brasil.id,
          awayTeamId: francia.id,
          homeGoals: 0,
          awayGoals: 0,
          homeTeam: brasil,
          awayTeam: francia,
        },
      ]);

      const result = await service.getStandings(competition.id);

      expect(result).toHaveLength(1);
      expect(result[0].groupName).toBeNull();
      expect(result[0].standings.map((row) => row.team.id)).toEqual([
        argentina.id,
        francia.id,
        brasil.id,
      ]);
      expect(result[0].standings[0].points).toBe(3);
      expect(result[0].standings[1].points).toBe(1);
      expect(result[0].standings[2].points).toBe(1);
    });

    it('retorna un array vacio cuando no hay equipos ni partidos finalizados', async () => {
      repository.findById.mockResolvedValue(competition);
      repository.findTeams.mockResolvedValue([]);
      repository.findFinishedMatches.mockResolvedValue([]);

      const result = await service.getStandings(competition.id);

      expect(result).toEqual([]);
    });
  });

  describe('findCompetitionTeams', () => {
    it('retorna los equipos de la competicion', async () => {
      repository.findById.mockResolvedValue(competition);
      repository.findTeams.mockResolvedValue([
        {
          teamId: 'team-arg',
          groupName: 'Grupo A',
          seed: 1,
          team: {
            id: 'team-arg',
            name: 'Argentina',
            shortName: 'ARG',
            logoUrl: null,
          },
        },
      ]);

      const result = await service.findCompetitionTeams(competition.id);

      expect(result).toEqual([
        {
          teamId: 'team-arg',
          groupName: 'Grupo A',
          seed: 1,
          team: {
            id: 'team-arg',
            name: 'Argentina',
            shortName: 'ARG',
            logoUrl: null,
          },
        },
      ]);
    });

    it('lanza NotFoundException cuando la competicion no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.findCompetitionTeams('missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('upsertTeam', () => {
    it('asigna grupo y seed a un equipo de la competicion', async () => {
      repository.findById.mockResolvedValue(competition);
      repository.upsertTeam.mockResolvedValue({
        teamId: 'team-arg',
        groupName: 'Grupo A',
        seed: 1,
        team: {
          id: 'team-arg',
          name: 'Argentina',
          shortName: 'ARG',
          logoUrl: null,
        },
      });

      const result = await service.upsertTeam(competition.id, 'team-arg', {
        groupName: 'Grupo A',
        seed: 1,
      });

      expect(repository.upsertTeam).toHaveBeenCalledWith(
        competition.id,
        'team-arg',
        { groupName: 'Grupo A', seed: 1 },
      );
      expect(result.groupName).toBe('Grupo A');
      expect(result.seed).toBe(1);
    });

    it('lanza NotFoundException cuando la competicion no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.upsertTeam('missing', 'team-arg', { groupName: 'Grupo A' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.upsertTeam).not.toHaveBeenCalled();
    });
  });

  describe('removeTeam', () => {
    it('quita un equipo de la competicion', async () => {
      repository.findById.mockResolvedValue(competition);

      await service.removeTeam(competition.id, 'team-arg');

      expect(repository.removeTeam).toHaveBeenCalledWith(
        competition.id,
        'team-arg',
      );
    });

    it('lanza NotFoundException cuando la competicion no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.removeTeam('missing', 'team-arg'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.removeTeam).not.toHaveBeenCalled();
    });
  });
});
