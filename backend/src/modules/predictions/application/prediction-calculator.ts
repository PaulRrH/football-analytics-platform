import { calculateEloOutcomeProbabilities } from '../../../common/utils/elo.util';
import {
  calculatePoissonOutcomeProbabilities,
  POISSON_HOME_ADVANTAGE_FACTOR,
} from '../../../common/utils/poisson.util';
import { TeamGoalAverages } from '../domain/prediction-repository.interface';

export interface PredictionCalcResult {
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  predictedHomeGoals?: number;
  predictedAwayGoals?: number;
}

const ENSEMBLE_WEIGHT_ELO = 0.5;
const ENSEMBLE_WEIGHT_POISSON = 0.5;

/**
 * Predicción `model = ELO` a partir del `eloRating` de ambos equipos
 * (ver PREDICTION_ENGINE.md §1).
 */
export function calculateEloPrediction(
  homeElo: number,
  awayElo: number,
): PredictionCalcResult {
  return calculateEloOutcomeProbabilities(homeElo, awayElo);
}

/**
 * Predicción `model = POISSON` a partir de las fuerzas de ataque/defensa de
 * ambos equipos y la media de goles de la liga (ver PREDICTION_ENGINE.md §2).
 */
export function calculatePoissonPrediction(
  home: TeamGoalAverages,
  away: TeamGoalAverages,
  leagueAvgGoals: number,
): PredictionCalcResult {
  const lambdaHome =
    ((home.attackFor * away.attackAgainst) / leagueAvgGoals) *
    POISSON_HOME_ADVANTAGE_FACTOR;
  const lambdaAway = (away.attackFor * home.attackAgainst) / leagueAvgGoals;

  return {
    ...calculatePoissonOutcomeProbabilities(lambdaHome, lambdaAway),
    predictedHomeGoals: lambdaHome,
    predictedAwayGoals: lambdaAway,
  };
}

/**
 * Predicción `model = ENSEMBLE`: combinación ponderada de Elo y Poisson
 * (ver PREDICTION_ENGINE.md §3).
 */
export function calculateEnsemblePrediction(
  elo: PredictionCalcResult,
  poisson: PredictionCalcResult,
): PredictionCalcResult {
  return {
    homeWinProbability:
      ENSEMBLE_WEIGHT_ELO * elo.homeWinProbability +
      ENSEMBLE_WEIGHT_POISSON * poisson.homeWinProbability,
    drawProbability:
      ENSEMBLE_WEIGHT_ELO * elo.drawProbability +
      ENSEMBLE_WEIGHT_POISSON * poisson.drawProbability,
    awayWinProbability:
      ENSEMBLE_WEIGHT_ELO * elo.awayWinProbability +
      ENSEMBLE_WEIGHT_POISSON * poisson.awayWinProbability,
    predictedHomeGoals: poisson.predictedHomeGoals,
    predictedAwayGoals: poisson.predictedAwayGoals,
  };
}
