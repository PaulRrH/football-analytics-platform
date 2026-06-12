import {
  applyMatchResult,
  createEmptyStandingsRow,
  sortStandings,
  type StandingsRow,
} from './standings.util';

type RowWithId = StandingsRow & { id: string };

describe('standings.util', () => {
  describe('applyMatchResult', () => {
    it('asigna 3 puntos al local cuando gana', () => {
      const home = createEmptyStandingsRow();
      const away = createEmptyStandingsRow();

      applyMatchResult(home, away, 2, 1);

      expect(home).toMatchObject({
        played: 1,
        won: 1,
        drawn: 0,
        lost: 0,
        goalsFor: 2,
        goalsAgainst: 1,
        goalDifference: 1,
        points: 3,
      });
      expect(away).toMatchObject({
        played: 1,
        won: 0,
        drawn: 0,
        lost: 1,
        goalsFor: 1,
        goalsAgainst: 2,
        goalDifference: -1,
        points: 0,
      });
    });

    it('asigna 3 puntos al visitante cuando gana', () => {
      const home = createEmptyStandingsRow();
      const away = createEmptyStandingsRow();

      applyMatchResult(home, away, 0, 2);

      expect(home.points).toBe(0);
      expect(home.lost).toBe(1);
      expect(away.points).toBe(3);
      expect(away.won).toBe(1);
    });

    it('asigna 1 punto a cada equipo en caso de empate', () => {
      const home = createEmptyStandingsRow();
      const away = createEmptyStandingsRow();

      applyMatchResult(home, away, 1, 1);

      expect(home).toMatchObject({ drawn: 1, points: 1, goalDifference: 0 });
      expect(away).toMatchObject({ drawn: 1, points: 1, goalDifference: 0 });
    });

    it('acumula resultados de varios partidos', () => {
      const row = createEmptyStandingsRow();
      const opponent = createEmptyStandingsRow();

      applyMatchResult(row, opponent, 2, 0);
      applyMatchResult(opponent, row, 1, 1);

      expect(row).toMatchObject({
        played: 2,
        won: 1,
        drawn: 1,
        lost: 0,
        goalsFor: 3,
        goalsAgainst: 1,
        goalDifference: 2,
        points: 4,
      });
    });
  });

  describe('sortStandings', () => {
    const tiebreaker = (a: RowWithId, b: RowWithId): number =>
      a.id.localeCompare(b.id);

    it('ordena por puntos descendente', () => {
      const a = { ...createEmptyStandingsRow(), id: 'a', points: 3 };
      const b = { ...createEmptyStandingsRow(), id: 'b', points: 6 };

      expect(sortStandings([a, b], tiebreaker).map((r) => r.id)).toEqual([
        'b',
        'a',
      ]);
    });

    it('rompe empates en puntos por diferencia de goles', () => {
      const a = {
        ...createEmptyStandingsRow(),
        id: 'a',
        points: 3,
        goalDifference: 1,
      };
      const b = {
        ...createEmptyStandingsRow(),
        id: 'b',
        points: 3,
        goalDifference: 2,
      };

      expect(sortStandings([a, b], tiebreaker).map((r) => r.id)).toEqual([
        'b',
        'a',
      ]);
    });

    it('rompe empates en puntos y diferencia de goles por goles a favor', () => {
      const a = {
        ...createEmptyStandingsRow(),
        id: 'a',
        points: 3,
        goalDifference: 1,
        goalsFor: 2,
      };
      const b = {
        ...createEmptyStandingsRow(),
        id: 'b',
        points: 3,
        goalDifference: 1,
        goalsFor: 3,
      };

      expect(sortStandings([a, b], tiebreaker).map((r) => r.id)).toEqual([
        'b',
        'a',
      ]);
    });

    it('usa el desempate provisto cuando todo lo demas es igual', () => {
      const a = { ...createEmptyStandingsRow(), id: 'b' };
      const b = { ...createEmptyStandingsRow(), id: 'a' };

      expect(sortStandings([a, b], tiebreaker).map((r) => r.id)).toEqual([
        'a',
        'b',
      ]);
    });

    it('no muta el array original', () => {
      const a = { ...createEmptyStandingsRow(), id: 'a', points: 0 };
      const b = { ...createEmptyStandingsRow(), id: 'b', points: 3 };
      const rows = [a, b];

      sortStandings(rows, tiebreaker);

      expect(rows).toEqual([a, b]);
    });
  });
});
