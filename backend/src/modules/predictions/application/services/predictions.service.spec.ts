import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { Prediction, PredictionModel } from '@prisma/client';
import { PREDICTION_UPDATED_EVENT } from '../../../realtime/domain/realtime-events';
import {
  IPredictionRepository,
  MatchEloContext,
  PREDICTION_REPOSITORY,
} from '../../domain/prediction-repository.interface';
import { PredictionsService } from './predictions.service';

describe('PredictionsService', () => {
  let service: PredictionsService;
  let repository: jest.Mocked<IPredictionRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const matchContext: MatchEloContext = {
    id: 'match-1',
    homeTeamId: 'home-team',
    awayTeamId: 'away-team',
    homeTeamEloRating: 1600,
    awayTeamEloRating: 1400,
  };

  const buildPrediction = (overrides: Partial<Prediction>): Prediction => ({
    id: 'prediction-id',
    matchId: 'match-1',
    model: PredictionModel.ELO,
    homeWinProbability: 0.5,
    drawProbability: 0.25,
    awayWinProbability: 0.25,
    predictedHomeGoals: null,
    predictedAwayGoals: null,
    generatedAt: new Date('2026-01-01'),
    ...overrides,
  });

  beforeEach(async () => {
    repository = {
      findMatchEloContext: jest.fn(),
      findLeagueAverageGoals: jest.fn(),
      findTeamGoalAverages: jest.fn(),
      findLatestPredictions: jest.fn(),
      createMany: jest.fn(),
    };

    eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictionsService,
        { provide: PREDICTION_REPOSITORY, useValue: repository },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(PredictionsService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getMatchPredictions', () => {
    it('lanza NotFoundException si el partido no existe', async () => {
      repository.findMatchEloContext.mockResolvedValue(null);

      await expect(
        service.getMatchPredictions('missing-match'),
      ).rejects.toThrow(NotFoundException);
      expect(repository.findLatestPredictions).not.toHaveBeenCalled();
    });

    it('devuelve solo la prediccion mas reciente de cada modelo', async () => {
      repository.findMatchEloContext.mockResolvedValue(matchContext);
      repository.findLatestPredictions.mockResolvedValue([
        buildPrediction({ id: 'elo-latest', model: PredictionModel.ELO }),
        buildPrediction({
          id: 'poisson-latest',
          model: PredictionModel.POISSON,
        }),
        buildPrediction({ id: 'elo-older', model: PredictionModel.ELO }),
      ]);

      const result = await service.getMatchPredictions(matchContext.id);

      expect(result).toHaveLength(2);
      expect(result.map((p) => p.id)).toEqual(['elo-latest', 'poisson-latest']);
    });
  });

  describe('generatePredictions', () => {
    it('lanza NotFoundException si el partido no existe', async () => {
      repository.findMatchEloContext.mockResolvedValue(null);

      await expect(
        service.generatePredictions('missing-match'),
      ).rejects.toThrow(NotFoundException);
      expect(repository.createMany).not.toHaveBeenCalled();
    });

    it('calcula y persiste las predicciones ELO, POISSON y ENSEMBLE', async () => {
      repository.findMatchEloContext.mockResolvedValue(matchContext);
      repository.findLeagueAverageGoals.mockResolvedValue(1.35);
      repository.findTeamGoalAverages.mockImplementation((teamId) =>
        Promise.resolve(
          teamId === matchContext.homeTeamId
            ? { attackFor: 1.5, attackAgainst: 1 }
            : { attackFor: 1, attackAgainst: 1.2 },
        ),
      );
      repository.createMany.mockImplementation((data) =>
        Promise.resolve(
          data.map((item, index) =>
            buildPrediction({ id: `prediction-${index}`, ...item }),
          ),
        ),
      );

      const result = await service.generatePredictions(matchContext.id);

      expect(repository.findTeamGoalAverages).toHaveBeenCalledWith(
        matchContext.homeTeamId,
      );
      expect(repository.findTeamGoalAverages).toHaveBeenCalledWith(
        matchContext.awayTeamId,
      );

      expect(repository.createMany).toHaveBeenCalledTimes(1);
      const [createData] = repository.createMany.mock.calls[0];
      expect(createData.map((d) => d.model)).toEqual([
        PredictionModel.ELO,
        PredictionModel.POISSON,
        PredictionModel.ENSEMBLE,
      ]);

      for (const prediction of createData) {
        expect(
          prediction.homeWinProbability +
            prediction.drawProbability +
            prediction.awayWinProbability,
        ).toBeCloseTo(1);
      }

      expect(result).toHaveLength(3);
    });

    it('emite prediction.updated con el matchId y las predicciones generadas', async () => {
      repository.findMatchEloContext.mockResolvedValue(matchContext);
      repository.findLeagueAverageGoals.mockResolvedValue(1.35);
      repository.findTeamGoalAverages.mockResolvedValue({
        attackFor: 1,
        attackAgainst: 1,
      });
      repository.createMany.mockImplementation((data) =>
        Promise.resolve(
          data.map((item, index) =>
            buildPrediction({ id: `prediction-${index}`, ...item }),
          ),
        ),
      );

      const result = await service.generatePredictions(matchContext.id);

      expect(eventEmitter.emit).toHaveBeenCalledWith(PREDICTION_UPDATED_EVENT, {
        matchId: matchContext.id,
        predictions: result,
      });
    });
  });
});
