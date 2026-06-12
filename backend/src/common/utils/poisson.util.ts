export const MAX_GOALS = 6;
export const POISSON_HOME_ADVANTAGE_FACTOR = 1.2;
export const DEFAULT_LEAGUE_AVERAGE_GOALS = 1.35;

export interface PoissonOutcomeProbabilities {
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
}

function factorial(n: number): number {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }

  return result;
}

/**
 * Función de masa de probabilidad de Poisson: P(X = k) para media `lambda`.
 */
export function poissonPmf(k: number, lambda: number): number {
  return (lambda ** k * Math.exp(-lambda)) / factorial(k);
}

/**
 * Probabilidades de resultado (local/empate/visitante) a partir de la matriz
 * de marcadores Poisson truncada a `maxGoals`, normalizada para sumar 1
 * (ver PREDICTION_ENGINE.md §2).
 */
export function calculatePoissonOutcomeProbabilities(
  lambdaHome: number,
  lambdaAway: number,
  maxGoals: number = MAX_GOALS,
): PoissonOutcomeProbabilities {
  let homeWinProbability = 0;
  let drawProbability = 0;
  let awayWinProbability = 0;

  for (let homeGoals = 0; homeGoals <= maxGoals; homeGoals++) {
    for (let awayGoals = 0; awayGoals <= maxGoals; awayGoals++) {
      const probability =
        poissonPmf(homeGoals, lambdaHome) * poissonPmf(awayGoals, lambdaAway);

      if (homeGoals > awayGoals) {
        homeWinProbability += probability;
      } else if (homeGoals === awayGoals) {
        drawProbability += probability;
      } else {
        awayWinProbability += probability;
      }
    }
  }

  const total = homeWinProbability + drawProbability + awayWinProbability;

  return {
    homeWinProbability: homeWinProbability / total,
    drawProbability: drawProbability / total,
    awayWinProbability: awayWinProbability / total,
  };
}

/**
 * Muestrea un numero de goles de una distribucion de Poisson de media
 * `lambda` usando el algoritmo de Knuth. `random` es inyectable para tests
 * deterministas (debe devolver valores en `[0, 1)`, como `Math.random`).
 */
export function samplePoissonGoals(
  lambda: number,
  random: () => number = Math.random,
): number {
  const limit = Math.exp(-lambda);
  let k = 0;
  let p = 1;

  do {
    k++;
    p *= random();
  } while (p > limit);

  return k - 1;
}
