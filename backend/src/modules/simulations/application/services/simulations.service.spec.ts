import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SimulationStatus } from '@prisma/client';
import {
  ISimulationRepository,
  SIMULATION_REPOSITORY,
  TournamentSimulationWithResults,
} from '../../domain/simulation-repository.interface';
import { DEFAULT_ITERATIONS } from '../tournament-simulator';
import { SimulationsService } from './simulations.service';

describe('SimulationsService', () => {
  let service: SimulationsService;
  let repository: jest.Mocked<ISimulationRepository>;

  const buildSimulation = (
    overrides: Partial<TournamentSimulationWithResults> = {},
  ): TournamentSimulationWithResults => ({
    id: 'sim-1',
    competitionId: 'comp-1',
    iterations: 100,
    status: SimulationStatus.COMPLETED,
    startedAt: new Date('2026-01-01T00:00:00Z'),
    completedAt: new Date('2026-01-01T00:00:01Z'),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    teamResults: [],
    ...overrides,
  });

  beforeEach(async () => {
    repository = {
      findCompetitionTeams: jest.fn(),
      findGroupStageMatches: jest.fn(),
      findLeagueAverageGoals: jest.fn(),
      findTeamGoalAverages: jest.fn(),
      createCompleted: jest.fn(),
      findById: jest.fn(),
      findTeamResult: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationsService,
        { provide: SIMULATION_REPOSITORY, useValue: repository },
      ],
    }).compile();

    service = module.get(SimulationsService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('lanza NotFoundException si la competicion no existe', async () => {
      repository.findCompetitionTeams.mockResolvedValue(null);

      await expect(
        service.create({ competitionId: 'comp-1' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lanza BadRequestException si ningun equipo tiene grupo asignado', async () => {
      repository.findCompetitionTeams.mockResolvedValue([
        { teamId: 'a', groupName: null, eloRating: 1500 },
        { teamId: 'b', groupName: null, eloRating: 1500 },
      ]);

      await expect(
        service.create({ competitionId: 'comp-1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('ejecuta la simulacion y persiste resultados completados', async () => {
      repository.findCompetitionTeams.mockResolvedValue([
        { teamId: 'a', groupName: 'Grupo A', eloRating: 1600 },
        { teamId: 'b', groupName: 'Grupo A', eloRating: 1500 },
        { teamId: 'c', groupName: 'Grupo B', eloRating: 1550 },
        { teamId: 'd', groupName: 'Grupo B', eloRating: 1450 },
      ]);
      repository.findGroupStageMatches.mockResolvedValue([
        { homeTeamId: 'a', awayTeamId: 'b', homeGoals: 2, awayGoals: 0 },
        { homeTeamId: 'c', awayTeamId: 'd', homeGoals: null, awayGoals: null },
      ]);
      repository.findLeagueAverageGoals.mockResolvedValue(1.3);
      repository.findTeamGoalAverages.mockResolvedValue({
        attackFor: 1.3,
        attackAgainst: 1,
      });
      repository.createCompleted.mockResolvedValue(
        buildSimulation({
          teamResults: ['a', 'b', 'c', 'd'].map((teamId) => ({
            id: `result-${teamId}`,
            simulationId: 'sim-1',
            teamId,
            groupStageProbability: 1,
            roundOf16Probability: null,
            quarterFinalProbability: null,
            semiFinalProbability: 1,
            finalProbability: 0.5,
            championProbability: 0.25,
            expectedPosition: 1.5,
            team: {
              id: teamId,
              name: teamId,
              shortName: teamId,
              logoUrl: null,
            },
          })),
        }),
      );

      const response = await service.create({
        competitionId: 'comp-1',
        iterations: 100,
      });

      expect(repository.createCompleted).toHaveBeenCalledTimes(1);

      const [competitionId, iterations, results] =
        repository.createCompleted.mock.calls[0];

      expect(competitionId).toBe('comp-1');
      expect(iterations).toBe(100);
      expect(results).toHaveLength(4);
      expect(results.map((r) => r.teamId).sort()).toEqual(['a', 'b', 'c', 'd']);

      const totalChampionProbability = results.reduce(
        (sum, r) => sum + r.championProbability,
        0,
      );
      expect(totalChampionProbability).toBeCloseTo(1, 1);

      expect(response.id).toBe('sim-1');
      expect(response.status).toBe(SimulationStatus.COMPLETED);
      expect(response.teamResults).toHaveLength(4);
    });

    it('usa DEFAULT_ITERATIONS cuando no se especifican iteraciones', async () => {
      repository.findCompetitionTeams.mockResolvedValue([
        { teamId: 'a', groupName: 'Grupo A', eloRating: 1500 },
        { teamId: 'b', groupName: 'Grupo A', eloRating: 1500 },
      ]);
      repository.findGroupStageMatches.mockResolvedValue([
        { homeTeamId: 'a', awayTeamId: 'b', homeGoals: 1, awayGoals: 1 },
      ]);
      repository.findLeagueAverageGoals.mockResolvedValue(1.3);
      repository.findTeamGoalAverages.mockResolvedValue({
        attackFor: 1.3,
        attackAgainst: 1,
      });
      repository.createCompleted.mockResolvedValue(buildSimulation());

      await service.create({ competitionId: 'comp-1' });

      const [, iterations] = repository.createCompleted.mock.calls[0];
      expect(iterations).toBe(DEFAULT_ITERATIONS);
    });
  });

  describe('getSimulation', () => {
    it('lanza NotFoundException si no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getSimulation('sim-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('devuelve el estado de la simulacion', async () => {
      repository.findById.mockResolvedValue(buildSimulation());

      const result = await service.getSimulation('sim-1');

      expect(result.id).toBe('sim-1');
      expect(result.status).toBe(SimulationStatus.COMPLETED);
    });
  });

  describe('getResults', () => {
    it('lanza NotFoundException si no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getResults('sim-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('ordena los resultados por championProbability descendente', async () => {
      repository.findById.mockResolvedValue(
        buildSimulation({
          teamResults: [
            {
              id: 'r1',
              simulationId: 'sim-1',
              teamId: 'a',
              groupStageProbability: 1,
              roundOf16Probability: null,
              quarterFinalProbability: null,
              semiFinalProbability: 1,
              finalProbability: 0.5,
              championProbability: 0.2,
              expectedPosition: 1.5,
              team: { id: 'a', name: 'A', shortName: 'AAA', logoUrl: null },
            },
            {
              id: 'r2',
              simulationId: 'sim-1',
              teamId: 'b',
              groupStageProbability: 1,
              roundOf16Probability: null,
              quarterFinalProbability: null,
              semiFinalProbability: 1,
              finalProbability: 0.5,
              championProbability: 0.8,
              expectedPosition: 1.5,
              team: { id: 'b', name: 'B', shortName: 'BBB', logoUrl: null },
            },
          ],
        }),
      );

      const result = await service.getResults('sim-1');

      expect(result.teamResults.map((r) => r.team.id)).toEqual(['b', 'a']);
    });
  });

  describe('getTeamResult', () => {
    it('lanza NotFoundException si la simulacion no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getTeamResult('sim-1', 'a')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lanza NotFoundException si el equipo no tiene resultados', async () => {
      repository.findById.mockResolvedValue(buildSimulation());
      repository.findTeamResult.mockResolvedValue(null);

      await expect(service.getTeamResult('sim-1', 'a')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('devuelve el resultado del equipo', async () => {
      repository.findById.mockResolvedValue(buildSimulation());
      repository.findTeamResult.mockResolvedValue({
        id: 'r1',
        simulationId: 'sim-1',
        teamId: 'a',
        groupStageProbability: 1,
        roundOf16Probability: null,
        quarterFinalProbability: null,
        semiFinalProbability: 1,
        finalProbability: 0.5,
        championProbability: 0.25,
        expectedPosition: 1.5,
        team: { id: 'a', name: 'A', shortName: 'AAA', logoUrl: null },
      });

      const result = await service.getTeamResult('sim-1', 'a');

      expect(result.team.id).toBe('a');
      expect(result.championProbability).toBe(0.25);
    });
  });
});
