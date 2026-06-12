import { PredictionModel } from './prediction.enum';

export interface Prediction {
  id: string;
  matchId: string;
  model: PredictionModel;
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  predictedHomeGoals: number | null;
  predictedAwayGoals: number | null;
  generatedAt: string;
}
