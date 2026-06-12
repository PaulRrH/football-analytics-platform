import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prediction } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PredictionModel } from '../../../../common/enums/prediction-model.enum';
import {
  type IPredictionRepository,
  type MatchEloContext,
  PREDICTION_REPOSITORY,
} from '../../domain/prediction-repository.interface';
import {
  calculateEloPrediction,
  calculateEnsemblePrediction,
  calculatePoissonPrediction,
} from '../prediction-calculator';
import { PredictionResponseDto } from '../dto/prediction-response.dto';

@Injectable()
export class PredictionsService {
  constructor(
    @Inject(PREDICTION_REPOSITORY)
    private readonly predictionRepository: IPredictionRepository,
  ) {}

  async getMatchPredictions(matchId: string): Promise<PredictionResponseDto[]> {
    await this.findMatchContextOrThrow(matchId);

    const predictions =
      await this.predictionRepository.findLatestPredictions(matchId);

    return this.dedupeByModel(predictions).map((prediction) =>
      this.toDto(prediction),
    );
  }

  async generatePredictions(matchId: string): Promise<PredictionResponseDto[]> {
    const context = await this.findMatchContextOrThrow(matchId);

    const [leagueAvgGoals, homeGoalAverages, awayGoalAverages] =
      await Promise.all([
        this.predictionRepository.findLeagueAverageGoals(),
        this.predictionRepository.findTeamGoalAverages(context.homeTeamId),
        this.predictionRepository.findTeamGoalAverages(context.awayTeamId),
      ]);

    const eloPrediction = calculateEloPrediction(
      context.homeTeamEloRating,
      context.awayTeamEloRating,
    );
    const poissonPrediction = calculatePoissonPrediction(
      homeGoalAverages,
      awayGoalAverages,
      leagueAvgGoals,
    );
    const ensemblePrediction = calculateEnsemblePrediction(
      eloPrediction,
      poissonPrediction,
    );

    const created = await this.predictionRepository.createMany([
      { matchId, model: PredictionModel.ELO, ...eloPrediction },
      { matchId, model: PredictionModel.POISSON, ...poissonPrediction },
      { matchId, model: PredictionModel.ENSEMBLE, ...ensemblePrediction },
    ]);

    return created.map((prediction) => this.toDto(prediction));
  }

  private dedupeByModel(predictions: Prediction[]): Prediction[] {
    const seenModels = new Set<PredictionModel>();
    const latest: Prediction[] = [];

    for (const prediction of predictions) {
      if (!seenModels.has(prediction.model)) {
        seenModels.add(prediction.model);
        latest.push(prediction);
      }
    }

    return latest;
  }

  private toDto(prediction: Prediction): PredictionResponseDto {
    return plainToInstance(PredictionResponseDto, prediction, {
      excludeExtraneousValues: true,
    });
  }

  private async findMatchContextOrThrow(
    matchId: string,
  ): Promise<MatchEloContext> {
    const context =
      await this.predictionRepository.findMatchEloContext(matchId);
    if (!context) {
      throw new NotFoundException(`Partido ${matchId} no encontrado`);
    }

    return context;
  }
}
