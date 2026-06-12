import { MatchStage } from '@prisma/client';
import {
  BASE_DRAW_PROBABILITY,
  calculateEloOutcomeProbabilities,
  calculateEloRatingChange,
  calculateExpectedHomeScore,
} from './elo.util';

describe('elo.util', () => {
  describe('calculateExpectedHomeScore', () => {
    it('devuelve 0.5 cuando los ratings son iguales y no hay ventaja de local', () => {
      expect(calculateExpectedHomeScore(1500, 1500, 0)).toBeCloseTo(0.5);
    });

    it('favorece al local cuando hay ventaja de local', () => {
      expect(calculateExpectedHomeScore(1500, 1500, 100)).toBeGreaterThan(0.5);
    });
  });

  describe('calculateEloOutcomeProbabilities', () => {
    it('reparte 50/50 entre local y visitante sin ventaja de local ni empate', () => {
      const result = calculateEloOutcomeProbabilities(1500, 1500, 0, 0);

      expect(result.homeWinProbability).toBeCloseTo(0.5);
      expect(result.awayWinProbability).toBeCloseTo(0.5);
      expect(result.drawProbability).toBe(0);
    });

    it('las probabilidades suman 1 y favorecen al local por defecto', () => {
      const result = calculateEloOutcomeProbabilities(1500, 1500);

      expect(
        result.homeWinProbability +
          result.drawProbability +
          result.awayWinProbability,
      ).toBeCloseTo(1);
      expect(result.drawProbability).toBe(BASE_DRAW_PROBABILITY);
      expect(result.homeWinProbability).toBeGreaterThan(
        result.awayWinProbability,
      );
    });
  });

  describe('calculateEloRatingChange', () => {
    it('aumenta el rating local y reduce el del visitante en una victoria local', () => {
      const result = calculateEloRatingChange(
        1500,
        1500,
        1,
        0,
        MatchStage.FRIENDLY,
      );

      expect(result).toEqual({ homeRating: 1507.2, awayRating: 1492.8 });
    });

    it('reduce el rating del favorito local y aumenta el del visitante en un empate', () => {
      const result = calculateEloRatingChange(
        1500,
        1500,
        1,
        1,
        MatchStage.FRIENDLY,
      );

      expect(result).toEqual({ homeRating: 1497.2, awayRating: 1502.8 });
    });

    it('aplica un multiplicador mayor a diferencias de gol más grandes', () => {
      const oneGoal = calculateEloRatingChange(
        1500,
        1500,
        1,
        0,
        MatchStage.FRIENDLY,
      );
      const threeGoals = calculateEloRatingChange(
        1500,
        1500,
        3,
        0,
        MatchStage.FRIENDLY,
      );

      expect(threeGoals.homeRating - 1500).toBeCloseTo(
        (oneGoal.homeRating - 1500) * 1.75,
      );
    });

    it('aplica un multiplicador mayor para partidos de mayor importancia', () => {
      const friendly = calculateEloRatingChange(
        1500,
        1500,
        1,
        0,
        MatchStage.FRIENDLY,
      );
      const final = calculateEloRatingChange(
        1500,
        1500,
        1,
        0,
        MatchStage.FINAL,
      );

      expect(final.homeRating - 1500).toBeCloseTo(
        (friendly.homeRating - 1500) * 2,
      );
    });
  });
});
