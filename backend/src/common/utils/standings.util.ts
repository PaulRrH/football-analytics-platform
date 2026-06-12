export interface StandingsRow {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export function createEmptyStandingsRow(): StandingsRow {
  return {
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

/**
 * Aplica el resultado de un partido (3 puntos por victoria, 1 por empate) a
 * las filas de tabla de ambos equipos, actualizando jugados/GF/GC/DG/puntos.
 */
export function applyMatchResult<T extends StandingsRow>(
  home: T,
  away: T,
  homeGoals: number,
  awayGoals: number,
): void {
  home.played += 1;
  away.played += 1;
  home.goalsFor += homeGoals;
  home.goalsAgainst += awayGoals;
  away.goalsFor += awayGoals;
  away.goalsAgainst += homeGoals;
  home.goalDifference = home.goalsFor - home.goalsAgainst;
  away.goalDifference = away.goalsFor - away.goalsAgainst;

  if (homeGoals > awayGoals) {
    home.won += 1;
    home.points += 3;
    away.lost += 1;
  } else if (homeGoals < awayGoals) {
    away.won += 1;
    away.points += 3;
    home.lost += 1;
  } else {
    home.drawn += 1;
    home.points += 1;
    away.drawn += 1;
    away.points += 1;
  }
}

/**
 * Ordena filas de tabla por puntos, diferencia de goles y goles a favor; el
 * criterio de desempate final se delega al llamador (p. ej. nombre de
 * equipo o id).
 */
export function sortStandings<T extends StandingsRow>(
  rows: T[],
  tiebreaker: (a: T, b: T) => number,
): T[] {
  return [...rows].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      tiebreaker(a, b),
  );
}
