import {
  calculatePoissonOutcomeProbabilities,
  poissonPmf,
  samplePoissonGoals,
} from './poisson.util';

describe('poisson.util', () => {
  describe('poissonPmf', () => {
    it('P(X=0) = e^-lambda', () => {
      expect(poissonPmf(0, 1)).toBeCloseTo(Math.exp(-1));
    });

    it('P(X=1) = lambda * e^-lambda', () => {
      expect(poissonPmf(1, 1)).toBeCloseTo(Math.exp(-1));
      expect(poissonPmf(1, 2)).toBeCloseTo(2 * Math.exp(-2));
    });

    it('P(X=2) = (lambda^2 / 2) * e^-lambda', () => {
      expect(poissonPmf(2, 2)).toBeCloseTo((4 / 2) * Math.exp(-2));
    });
  });

  describe('calculatePoissonOutcomeProbabilities', () => {
    it('las probabilidades suman 1', () => {
      const result = calculatePoissonOutcomeProbabilities(1.5, 1.2);

      expect(
        result.homeWinProbability +
          result.drawProbability +
          result.awayWinProbability,
      ).toBeCloseTo(1);
    });

    it('reparte 50/50 entre local y visitante cuando las medias son iguales', () => {
      const result = calculatePoissonOutcomeProbabilities(1.5, 1.5);

      expect(result.homeWinProbability).toBeCloseTo(result.awayWinProbability);
    });

    it('favorece al equipo con mayor media de goles esperados', () => {
      const result = calculatePoissonOutcomeProbabilities(2.5, 1);

      expect(result.homeWinProbability).toBeGreaterThan(
        result.awayWinProbability,
      );
    });
  });

  describe('samplePoissonGoals', () => {
    it('siempre devuelve 0 cuando lambda es 0', () => {
      expect(samplePoissonGoals(0, () => 0.99)).toBe(0);
      expect(samplePoissonGoals(0, () => 0.01)).toBe(0);
    });

    it('es determinista para un generador fijo', () => {
      expect(samplePoissonGoals(2, () => 0.5)).toBe(2);
    });

    it('crece cuando el generador produce valores mas cercanos a 1', () => {
      const small = samplePoissonGoals(1, () => 0.1);
      const large = samplePoissonGoals(1, () => 0.9);

      expect(large).toBeGreaterThan(small);
    });

    it('devuelve un entero no negativo con Math.random', () => {
      const result = samplePoissonGoals(1.5);

      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });
});
