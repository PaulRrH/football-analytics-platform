import { Prediction, PredictionModel } from '@prisma/client';

export const PREDICTION_REPOSITORY = 'PREDICTION_REPOSITORY';

export interface MatchEloContext {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamEloRating: number;
  awayTeamEloRating: number;
}

export interface TeamGoalAverages {
  attackFor: number;
  attackAgainst: number;
}

export interface CreatePredictionData {
  matchId: string;
  model: PredictionModel;
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  predictedHomeGoals?: number;
  predictedAwayGoals?: number;
}

/**
 * Puerto (Repository pattern) para el motor de predicciones: lectura del
 * contexto Elo/Poisson de un partido y persistencia de `Prediction`. La
 * implementacion concreta vive en infrastructure/repositories.
 */
export interface IPredictionRepository {
  findMatchEloContext(matchId: string): Promise<MatchEloContext | null>;
  findLeagueAverageGoals(): Promise<number>;
  findTeamGoalAverages(teamId: string): Promise<TeamGoalAverages>;
  findLatestPredictions(matchId: string): Promise<Prediction[]>;
  createMany(data: CreatePredictionData[]): Promise<Prediction[]>;
}
