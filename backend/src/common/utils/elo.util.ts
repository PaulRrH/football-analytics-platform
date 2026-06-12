import { MatchStage } from '@prisma/client';

export const HOME_ADVANTAGE_ELO = 100;
export const BASE_DRAW_PROBABILITY = 0.25;
export const ELO_K_FACTOR = 20;

export interface EloOutcomeProbabilities {
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
}

export interface EloRatingChange {
  homeRating: number;
  awayRating: number;
}

const STAGE_IMPORTANCE_MULTIPLIER: Record<MatchStage, number> = {
  [MatchStage.FRIENDLY]: 1,
  [MatchStage.QUALIFIER]: 1.5,
  [MatchStage.GROUP_STAGE]: 1.75,
  [MatchStage.ROUND_OF_16]: 1.75,
  [MatchStage.QUARTER_FINAL]: 1.75,
  [MatchStage.SEMI_FINAL]: 1.75,
  [MatchStage.THIRD_PLACE]: 1.75,
  [MatchStage.FINAL]: 2,
};

/**
 * Probabilidad esperada de victoria local según el modelo Elo
 * (World Football Elo Ratings): E_home = 1 / (1 + 10^((R_away - R_home - HomeAdv) / 400)).
 */
export function calculateExpectedHomeScore(
  homeRating: number,
  awayRating: number,
  homeAdvantage: number = HOME_ADVANTAGE_ELO,
): number {
  return 1 / (1 + 10 ** ((awayRating - homeRating - homeAdvantage) / 400));
}

/**
 * Convierte la probabilidad esperada de victoria local en probabilidades de
 * resultado (local/empate/visitante), repartiendo `drawProbability` a partir
 * de un valor empírico fijo.
 */
export function calculateEloOutcomeProbabilities(
  homeRating: number,
  awayRating: number,
  homeAdvantage: number = HOME_ADVANTAGE_ELO,
  drawProbability: number = BASE_DRAW_PROBABILITY,
): EloOutcomeProbabilities {
  const expectedHome = calculateExpectedHomeScore(
    homeRating,
    awayRating,
    homeAdvantage,
  );
  const expectedAway = 1 - expectedHome;

  return {
    homeWinProbability: expectedHome * (1 - drawProbability),
    drawProbability,
    awayWinProbability: expectedAway * (1 - drawProbability),
  };
}

function calculateGoalDiffMultiplier(goalDiff: number): number {
  if (goalDiff <= 1) {
    return 1;
  }

  if (goalDiff === 2) {
    return 1.5;
  }

  return (11 + goalDiff) / 8;
}

/**
 * Nuevo `eloRating` de ambos equipos tras un resultado, según
 * R' = R + K · (S - E), con K ajustado por diferencia de goles e importancia
 * del torneo (ver PREDICTION_ENGINE.md §1).
 */
export function calculateEloRatingChange(
  homeRating: number,
  awayRating: number,
  homeGoals: number,
  awayGoals: number,
  stage: MatchStage,
): EloRatingChange {
  const expectedHome = calculateExpectedHomeScore(homeRating, awayRating);
  const expectedAway = 1 - expectedHome;

  const actualHome =
    homeGoals === awayGoals ? 0.5 : homeGoals > awayGoals ? 1 : 0;
  const actualAway = 1 - actualHome;

  const k =
    ELO_K_FACTOR *
    calculateGoalDiffMultiplier(Math.abs(homeGoals - awayGoals)) *
    STAGE_IMPORTANCE_MULTIPLIER[stage];

  return {
    homeRating:
      Math.round((homeRating + k * (actualHome - expectedHome)) * 10) / 10,
    awayRating:
      Math.round((awayRating + k * (actualAway - expectedAway)) * 10) / 10,
  };
}
