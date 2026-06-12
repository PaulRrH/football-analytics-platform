import type { TeamGoalAverages } from '../../predictions/domain/prediction-repository.interface';
import {
  buildBracket,
  computeStandings,
  generateBracketSeedOrder,
  nextPowerOfTwo,
  runTournamentSimulation,
  selectQualifiers,
  simulateBracket,
  simulateGroupMatch,
  simulateKnockoutMatch,
  type SimGroupMatch,
  type SimGroupTeam,
} from './tournament-simulator';

describe('tournament-simulator', () => {
  describe('nextPowerOfTwo', () => {
    it.each([
      [1, 1],
      [2, 2],
      [3, 4],
      [4, 4],
      [5, 8],
      [6, 8],
    ])('nextPowerOfTwo(%i) === %i', (input, expected) => {
      expect(nextPowerOfTwo(input)).toBe(expected);
    });
  });

  describe('generateBracketSeedOrder', () => {
    it('size=2 -> [1,2]', () => {
      expect(generateBracketSeedOrder(2)).toEqual([1, 2]);
    });

    it('size=4 -> [1,4,2,3]', () => {
      expect(generateBracketSeedOrder(4)).toEqual([1, 4, 2, 3]);
    });

    it('size=8 -> [1,8,4,5,2,7,3,6]', () => {
      expect(generateBracketSeedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
    });
  });

  describe('buildBracket', () => {
    it('asigna todos los slots sin byes cuando el numero de clasificados es potencia de 2', () => {
      expect(buildBracket(['A', 'B', 'C', 'D'])).toEqual(['A', 'D', 'B', 'C']);
    });

    it('rellena con null (bye) los slots sobrantes cuando no es potencia de 2', () => {
      expect(buildBracket(['A', 'B', 'C'])).toEqual(['A', null, 'B', 'C']);
    });

    it('con 6 clasificados asigna los 2 byes a los peores sembrados', () => {
      expect(buildBracket(['A', 'B', 'C', 'D', 'E', 'F'])).toEqual([
        'A',
        null,
        'D',
        'E',
        'B',
        null,
        'C',
        'F',
      ]);
    });
  });

  describe('computeStandings', () => {
    it('ordena por puntos, diferencia de goles, goles a favor y desempate por teamId', () => {
      const teams: SimGroupTeam[] = [
        { teamId: 'a', groupName: 'G1', eloRating: 1500 },
        { teamId: 'b', groupName: 'G1', eloRating: 1500 },
        { teamId: 'c', groupName: 'G1', eloRating: 1500 },
      ];
      const results = [
        {
          homeTeamId: 'a',
          awayTeamId: 'b',
          groupName: 'G1',
          homeGoals: 2,
          awayGoals: 0,
        },
        {
          homeTeamId: 'b',
          awayTeamId: 'c',
          groupName: 'G1',
          homeGoals: 1,
          awayGoals: 1,
        },
        {
          homeTeamId: 'c',
          awayTeamId: 'a',
          groupName: 'G1',
          homeGoals: 0,
          awayGoals: 1,
        },
      ];

      // a: 2 victorias (6 pts, DG +3); b y c: 1 empate cada uno (1 pt), pero
      // c tiene mejor diferencia de goles (-1) que b (-2).
      expect(computeStandings(teams, results).get('G1')).toEqual([
        'a',
        'c',
        'b',
      ]);
    });
  });

  describe('selectQualifiers', () => {
    it('toma los primeros de cada grupo (orden alfabetico), luego los segundos', () => {
      const standingsByGroup = new Map([
        ['Grupo B', ['c', 'd', 'e']],
        ['Grupo A', ['a', 'b']],
      ]);

      expect(selectQualifiers(standingsByGroup)).toEqual(['a', 'c', 'b', 'd']);
    });
  });

  describe('simulateGroupMatch', () => {
    const strengths = new Map<string, TeamGoalAverages>([
      ['a', { attackFor: 1.5, attackAgainst: 1 }],
      ['b', { attackFor: 1, attackAgainst: 1.5 }],
    ]);

    it('devuelve el resultado real cuando el partido ya tiene marcador', () => {
      const match: SimGroupMatch = {
        homeTeamId: 'a',
        awayTeamId: 'b',
        groupName: 'G1',
        homeGoals: 3,
        awayGoals: 1,
      };

      expect(simulateGroupMatch(match, strengths, 1.3)).toEqual({
        homeTeamId: 'a',
        awayTeamId: 'b',
        groupName: 'G1',
        homeGoals: 3,
        awayGoals: 1,
      });
    });

    it('muestrea goles Poisson cuando el partido no tiene marcador', () => {
      const match: SimGroupMatch = {
        homeTeamId: 'a',
        awayTeamId: 'b',
        groupName: 'G1',
        homeGoals: null,
        awayGoals: null,
      };

      const result = simulateGroupMatch(match, strengths, 1.3, () => 0.5);

      expect(Number.isInteger(result.homeGoals)).toBe(true);
      expect(Number.isInteger(result.awayGoals)).toBe(true);
      expect(result.homeGoals).toBeGreaterThanOrEqual(0);
      expect(result.awayGoals).toBeGreaterThanOrEqual(0);
    });
  });

  describe('simulateKnockoutMatch', () => {
    const eloByTeam = new Map([
      ['a', 1600],
      ['b', 1500],
    ]);
    const strengths = new Map<string, TeamGoalAverages>([
      ['a', { attackFor: 1.4, attackAgainst: 1.1 }],
      ['b', { attackFor: 1.2, attackAgainst: 1.2 }],
    ]);

    it('con roll=0 siempre gana el primer equipo', () => {
      expect(
        simulateKnockoutMatch('a', 'b', eloByTeam, strengths, 1.3, () => 0),
      ).toBe('a');
    });

    it('con roll cercano a 1 siempre gana el segundo equipo', () => {
      expect(
        simulateKnockoutMatch(
          'a',
          'b',
          eloByTeam,
          strengths,
          1.3,
          () => 0.999999,
        ),
      ).toBe('b');
    });
  });

  describe('simulateBracket', () => {
    const eloByTeam = new Map([
      ['a', 1600],
      ['b', 1500],
      ['c', 1550],
      ['d', 1450],
    ]);
    const strengths = new Map<string, TeamGoalAverages>([
      ['a', { attackFor: 1.4, attackAgainst: 1.1 }],
      ['b', { attackFor: 1.2, attackAgainst: 1.2 }],
      ['c', { attackFor: 1.3, attackAgainst: 1.1 }],
      ['d', { attackFor: 1.1, attackAgainst: 1.3 }],
    ]);

    it('con roll=0 gana siempre el primer equipo de cada enfrentamiento', () => {
      const { champion, reached } = simulateBracket(
        ['a', 'b', 'c', 'd'],
        eloByTeam,
        strengths,
        1.3,
        () => 0,
      );

      expect(champion).toBe('a');
      expect(reached.get('a')).toEqual(new Set([4, 2]));
      expect(reached.get('b')).toEqual(new Set([4]));
      expect(reached.get('c')).toEqual(new Set([4, 2]));
      expect(reached.get('d')).toEqual(new Set([4]));
    });

    it('un bye avanza automaticamente sin consumir random', () => {
      const { champion, reached } = simulateBracket(
        ['a', null],
        eloByTeam,
        strengths,
        1.3,
        () => 0,
      );

      expect(champion).toBe('a');
      expect(reached.get('a')).toEqual(new Set([2]));
    });
  });

  describe('runTournamentSimulation', () => {
    const teams: SimGroupTeam[] = [
      { teamId: 'a', groupName: 'Grupo A', eloRating: 1600 },
      { teamId: 'b', groupName: 'Grupo A', eloRating: 1500 },
      { teamId: 'c', groupName: 'Grupo B', eloRating: 1550 },
      { teamId: 'd', groupName: 'Grupo B', eloRating: 1450 },
    ];

    // Resultados ya finalizados: los standings de grupo son deterministas
    // (a y c siempre 1os, b y d siempre 2dos) sin consumir random.
    const matches: SimGroupMatch[] = [
      {
        homeTeamId: 'a',
        awayTeamId: 'b',
        groupName: 'Grupo A',
        homeGoals: 2,
        awayGoals: 0,
      },
      {
        homeTeamId: 'c',
        awayTeamId: 'd',
        groupName: 'Grupo B',
        homeGoals: 1,
        awayGoals: 0,
      },
    ];

    const strengths = new Map<string, TeamGoalAverages>([
      ['a', { attackFor: 1.3, attackAgainst: 1 }],
      ['b', { attackFor: 1.3, attackAgainst: 1 }],
      ['c', { attackFor: 1.3, attackAgainst: 1 }],
      ['d', { attackFor: 1.3, attackAgainst: 1 }],
    ]);

    it('con 2 grupos de 2 equipos, octavos y cuartos son null y semis/final existen', () => {
      const results = runTournamentSimulation(
        teams,
        matches,
        strengths,
        1.3,
        10,
        () => 0.5,
      );

      for (const result of results) {
        expect(result.roundOf16Probability).toBeNull();
        expect(result.quarterFinalProbability).toBeNull();
        // bracketSize = 4 -> los 4 clasificados arrancan en semifinales.
        expect(result.semiFinalProbability).toBe(1);
        expect(result.finalProbability).not.toBeNull();
      }

      // Resultados de grupo fijos: ambos equipos de cada grupo de 2
      // clasifican siempre (QUALIFIERS_PER_GROUP = 2).
      expect(results.find((r) => r.teamId === 'a')?.groupStageProbability).toBe(
        1,
      );
      expect(results.find((r) => r.teamId === 'b')?.groupStageProbability).toBe(
        1,
      );
      expect(results.find((r) => r.teamId === 'c')?.groupStageProbability).toBe(
        1,
      );
      expect(results.find((r) => r.teamId === 'd')?.groupStageProbability).toBe(
        1,
      );

      // a y c ganan siempre su grupo (posicion 1); b y d quedan siempre 2os.
      expect(results.find((r) => r.teamId === 'a')?.expectedPosition).toBe(1);
      expect(results.find((r) => r.teamId === 'b')?.expectedPosition).toBe(2);
      expect(results.find((r) => r.teamId === 'c')?.expectedPosition).toBe(1);
      expect(results.find((r) => r.teamId === 'd')?.expectedPosition).toBe(2);

      // Exactamente 1 campeon por iteracion -> las probabilidades suman 1.
      const totalChampionProbability = results.reduce(
        (sum, r) => sum + r.championProbability,
        0,
      );
      expect(totalChampionProbability).toBeCloseTo(1);

      // Exactamente 2 finalistas por iteracion -> las probabilidades suman 2.
      const totalFinalProbability = results.reduce(
        (sum, r) => sum + (r.finalProbability ?? 0),
        0,
      );
      expect(totalFinalProbability).toBeCloseTo(2);
    });
  });
});
