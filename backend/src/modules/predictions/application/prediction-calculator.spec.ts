import {
  calculateEloPrediction,
  calculateEnsemblePrediction,
  calculatePoissonPrediction,
} from './prediction-calculator';

describe('prediction-calculator', () => {
  describe('calculateEloPrediction', () => {
    it('favorece al local cuando tiene mayor eloRating', () => {
      const result = calculateEloPrediction(2000, 1500);

      expect(result.homeWinProbability).toBeGreaterThan(
        result.awayWinProbability,
      );
      expect(
        result.homeWinProbability +
          result.drawProbability +
          result.awayWinProbability,
      ).toBeCloseTo(1);
    });
  });

  describe('calculatePoissonPrediction', () => {
    it('calcula goles esperados a partir de las fuerzas de ataque/defensa', () => {
      const home = { attackFor: 1.5, attackAgainst: 1 };
      const away = { attackFor: 1, attackAgainst: 1 };
      const leagueAvgGoals = 1.35;

      const result = calculatePoissonPrediction(home, away, leagueAvgGoals);

      expect(result.predictedHomeGoals).toBeGreaterThan(0);
      expect(result.predictedAwayGoals).toBeGreaterThan(0);
      expect(
        result.homeWinProbability +
          result.drawProbability +
          result.awayWinProbability,
      ).toBeCloseTo(1);
    });

    it('favorece al local cuando ambos equipos son equivalentes (ventaja de local)', () => {
      const team = { attackFor: 1, attackAgainst: 1 };

      const result = calculatePoissonPrediction(team, team, 1.35);

      expect(result.homeWinProbability).toBeGreaterThan(
        result.awayWinProbability,
      );
      expect(result.predictedHomeGoals).toBeGreaterThan(
        result.predictedAwayGoals!,
      );
    });
  });

  describe('calculateEnsemblePrediction', () => {
    it('promedia las probabilidades de Elo y Poisson y conserva los goles esperados de Poisson', () => {
      const elo = {
        homeWinProbability: 0.6,
        drawProbability: 0.2,
        awayWinProbability: 0.2,
      };
      const poisson = {
        homeWinProbability: 0.4,
        drawProbability: 0.3,
        awayWinProbability: 0.3,
        predictedHomeGoals: 1.8,
        predictedAwayGoals: 1.1,
      };

      const result = calculateEnsemblePrediction(elo, poisson);

      expect(result.homeWinProbability).toBeCloseTo(0.5);
      expect(result.drawProbability).toBeCloseTo(0.25);
      expect(result.awayWinProbability).toBeCloseTo(0.25);
      expect(result.predictedHomeGoals).toBe(1.8);
      expect(result.predictedAwayGoals).toBe(1.1);
    });
  });
});
