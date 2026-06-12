import {
  calculateEloOutcomeProbabilities,
  HOME_ADVANTAGE_ELO,
} from '../../../common/utils/elo.util';
import { samplePoissonGoals } from '../../../common/utils/poisson.util';
import {
  applyMatchResult,
  createEmptyStandingsRow,
  sortStandings,
  type StandingsRow,
} from '../../../common/utils/standings.util';
import {
  calculateEloPrediction,
  calculateEnsemblePrediction,
  calculatePoissonPrediction,
} from '../../predictions/application/prediction-calculator';
import type { TeamGoalAverages } from '../../predictions/domain/prediction-repository.interface';

export const QUALIFIERS_PER_GROUP = 2;
export const MIN_ITERATIONS = 100;
export const MAX_ITERATIONS = 5000;
export const DEFAULT_ITERATIONS = 1000;

/**
 * Tamaños de bracket que corresponden a una fase con nombre propio:
 * 16 -> octavos, 8 -> cuartos, 4 -> semifinales, 2 -> final.
 */
const TRACKED_BRACKET_SIZES: readonly number[] = [16, 8, 4, 2];

export interface SimGroupTeam {
  teamId: string;
  groupName: string;
  eloRating: number;
}

export interface SimGroupMatch {
  homeTeamId: string;
  awayTeamId: string;
  groupName: string;
  homeGoals: number | null;
  awayGoals: number | null;
}

export interface SimMatchResult {
  homeTeamId: string;
  awayTeamId: string;
  groupName: string;
  homeGoals: number;
  awayGoals: number;
}

export interface SimBracketResult {
  champion: string | null;
  reached: Map<string, Set<number>>;
}

export interface SimTeamResult {
  teamId: string;
  groupStageProbability: number;
  expectedPosition: number;
  roundOf16Probability: number | null;
  quarterFinalProbability: number | null;
  semiFinalProbability: number | null;
  finalProbability: number | null;
  championProbability: number;
}

interface GroupStandingsRow extends StandingsRow {
  teamId: string;
}

/**
 * Resuelve el resultado de un partido de fase de grupos: si el partido ya
 * tiene marcador (FINISHED), lo devuelve tal cual; si no, muestrea goles
 * Poisson a partir de las fuerzas de ataque/defensa de ambos equipos.
 */
export function simulateGroupMatch(
  match: SimGroupMatch,
  strengths: Map<string, TeamGoalAverages>,
  leagueAvgGoals: number,
  random: () => number = Math.random,
): SimMatchResult {
  if (match.homeGoals !== null && match.awayGoals !== null) {
    return {
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      groupName: match.groupName,
      homeGoals: match.homeGoals,
      awayGoals: match.awayGoals,
    };
  }

  const { predictedHomeGoals = 0, predictedAwayGoals = 0 } =
    calculatePoissonPrediction(
      strengths.get(match.homeTeamId)!,
      strengths.get(match.awayTeamId)!,
      leagueAvgGoals,
    );

  return {
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    groupName: match.groupName,
    homeGoals: samplePoissonGoals(predictedHomeGoals, random),
    awayGoals: samplePoissonGoals(predictedAwayGoals, random),
  };
}

/**
 * Calcula la clasificación de cada grupo (mejor a peor) a partir de los
 * resultados de una iteración, usando las mismas reglas que
 * `CompetitionsService.getStandings` (3/1/0 puntos, DG, GF, desempate por id).
 */
export function computeStandings(
  teams: SimGroupTeam[],
  results: SimMatchResult[],
): Map<string, string[]> {
  const rowsByTeamId = new Map<string, GroupStandingsRow>();

  for (const team of teams) {
    rowsByTeamId.set(team.teamId, {
      ...createEmptyStandingsRow(),
      teamId: team.teamId,
    });
  }

  for (const result of results) {
    const homeRow = rowsByTeamId.get(result.homeTeamId);
    const awayRow = rowsByTeamId.get(result.awayTeamId);

    if (!homeRow || !awayRow) {
      continue;
    }

    applyMatchResult(homeRow, awayRow, result.homeGoals, result.awayGoals);
  }

  const standingsByGroup = new Map<string, string[]>();

  for (const groupName of new Set(teams.map((team) => team.groupName))) {
    const rows = teams
      .filter((team) => team.groupName === groupName)
      .map((team) => rowsByTeamId.get(team.teamId)!);

    standingsByGroup.set(
      groupName,
      sortStandings(rows, (a, b) => a.teamId.localeCompare(b.teamId)).map(
        (row) => row.teamId,
      ),
    );
  }

  return standingsByGroup;
}

/**
 * Selecciona los clasificados de cada grupo (los `QUALIFIERS_PER_GROUP`
 * mejores), ordenados por siembra: todos los primeros (grupos en orden
 * alfabético), luego todos los segundos, etc.
 */
export function selectQualifiers(
  standingsByGroup: Map<string, string[]>,
): string[] {
  const groupNames = [...standingsByGroup.keys()].sort();
  const qualifiers: string[] = [];

  for (let position = 0; position < QUALIFIERS_PER_GROUP; position++) {
    for (const groupName of groupNames) {
      const group = standingsByGroup.get(groupName)!;

      if (position < group.length) {
        qualifiers.push(group[position]);
      }
    }
  }

  return qualifiers;
}

export function nextPowerOfTwo(n: number): number {
  if (n <= 1) {
    return 1;
  }

  return 2 ** Math.ceil(Math.log2(n));
}

/**
 * Orden de siembra de un bracket de eliminación directa: para `size = 2`,
 * `[1, 2]`; para `size = 2n`, intercala `[s, 2n + 1 - s]` por cada `s` del
 * orden de `size = n` (p. ej. 4 -> `[1,4,2,3]`, 8 -> `[1,8,4,5,2,7,3,6]`).
 */
export function generateBracketSeedOrder(size: number): number[] {
  if (size <= 1) {
    return [1];
  }

  if (size === 2) {
    return [1, 2];
  }

  const half = generateBracketSeedOrder(size / 2);
  const order: number[] = [];

  for (const seed of half) {
    order.push(seed, size + 1 - seed);
  }

  return order;
}

/**
 * Construye los slots del bracket asignando cada clasificado a su posición
 * de siembra; los slots sin clasificado (cuando el número de clasificados no
 * es potencia de 2) quedan en `null` (bye).
 */
export function buildBracket(qualifiers: string[]): (string | null)[] {
  const bracketSize = nextPowerOfTwo(qualifiers.length);

  return generateBracketSeedOrder(bracketSize).map(
    (seed) => qualifiers[seed - 1] ?? null,
  );
}

/**
 * Resuelve un partido de eliminatoria: muestrea local/empate/visitante con la
 * predicción ensemble (Elo + Poisson) y, en caso de empate, reparte el
 * resultado según las probabilidades Elo puras (sin empate posible).
 */
export function simulateKnockoutMatch(
  teamAId: string,
  teamBId: string,
  eloByTeam: Map<string, number>,
  strengths: Map<string, TeamGoalAverages>,
  leagueAvgGoals: number,
  random: () => number = Math.random,
): string {
  const eloA = eloByTeam.get(teamAId)!;
  const eloB = eloByTeam.get(teamBId)!;

  const ensemble = calculateEnsemblePrediction(
    calculateEloPrediction(eloA, eloB),
    calculatePoissonPrediction(
      strengths.get(teamAId)!,
      strengths.get(teamBId)!,
      leagueAvgGoals,
    ),
  );

  const roll = random();

  if (roll < ensemble.homeWinProbability) {
    return teamAId;
  }

  if (roll < ensemble.homeWinProbability + ensemble.drawProbability) {
    const eloOnly = calculateEloOutcomeProbabilities(
      eloA,
      eloB,
      HOME_ADVANTAGE_ELO,
      0,
    );

    return random() < eloOnly.homeWinProbability ? teamAId : teamBId;
  }

  return teamBId;
}

/**
 * Simula un bracket de eliminación directa completo a partir de sus slots
 * iniciales. Devuelve el campeón y, para cada equipo, los tamaños de bracket
 * (de `TRACKED_BRACKET_SIZES`) en los que llegó a participar.
 */
export function simulateBracket(
  slots: (string | null)[],
  eloByTeam: Map<string, number>,
  strengths: Map<string, TeamGoalAverages>,
  leagueAvgGoals: number,
  random: () => number = Math.random,
): SimBracketResult {
  const reached = new Map<string, Set<number>>();
  let current = slots;

  while (current.length > 1) {
    if (TRACKED_BRACKET_SIZES.includes(current.length)) {
      for (const teamId of current) {
        if (teamId !== null) {
          if (!reached.has(teamId)) {
            reached.set(teamId, new Set());
          }
          reached.get(teamId)!.add(current.length);
        }
      }
    }

    const next: (string | null)[] = [];

    for (let i = 0; i < current.length; i += 2) {
      const teamA = current[i];
      const teamB = current[i + 1];

      if (teamA === null) {
        next.push(teamB);
      } else if (teamB === null) {
        next.push(teamA);
      } else {
        next.push(
          simulateKnockoutMatch(
            teamA,
            teamB,
            eloByTeam,
            strengths,
            leagueAvgGoals,
            random,
          ),
        );
      }
    }

    current = next;
  }

  return { champion: current[0] ?? null, reached };
}

/**
 * Ejecuta una simulación Monte Carlo del torneo (fase de grupos +
 * eliminatorias) y devuelve, por equipo, la probabilidad de alcanzar cada
 * fase. Las fases de `roundOfX`/`quarterFinal`/`semiFinal`/`final` son
 * `null` cuando el bracket es demasiado pequeño para que esa fase exista.
 */
export function runTournamentSimulation(
  teams: SimGroupTeam[],
  matches: SimGroupMatch[],
  strengths: Map<string, TeamGoalAverages>,
  leagueAvgGoals: number,
  iterations: number,
  random: () => number = Math.random,
): SimTeamResult[] {
  const eloByTeam = new Map(teams.map((team) => [team.teamId, team.eloRating]));

  const groupSizes = new Map<string, number>();
  for (const team of teams) {
    groupSizes.set(team.groupName, (groupSizes.get(team.groupName) ?? 0) + 1);
  }

  const numQualifiers = [...groupSizes.values()].reduce(
    (sum, size) => sum + Math.min(QUALIFIERS_PER_GROUP, size),
    0,
  );
  const bracketSize = nextPowerOfTwo(numQualifiers);

  const groupStageCount = new Map<string, number>();
  const positionSum = new Map<string, number>();
  const championCount = new Map<string, number>();
  const roundCounts = new Map<string, Map<number, number>>();

  for (const team of teams) {
    groupStageCount.set(team.teamId, 0);
    positionSum.set(team.teamId, 0);
    championCount.set(team.teamId, 0);
    roundCounts.set(
      team.teamId,
      new Map(TRACKED_BRACKET_SIZES.map((size): [number, number] => [size, 0])),
    );
  }

  for (let i = 0; i < iterations; i++) {
    const results = matches.map((match) =>
      simulateGroupMatch(match, strengths, leagueAvgGoals, random),
    );
    const standingsByGroup = computeStandings(teams, results);

    for (const groupTeamIds of standingsByGroup.values()) {
      groupTeamIds.forEach((teamId, index) => {
        positionSum.set(teamId, (positionSum.get(teamId) ?? 0) + index + 1);

        if (index < QUALIFIERS_PER_GROUP) {
          groupStageCount.set(teamId, (groupStageCount.get(teamId) ?? 0) + 1);
        }
      });
    }

    const slots = buildBracket(selectQualifiers(standingsByGroup));
    const { champion, reached } = simulateBracket(
      slots,
      eloByTeam,
      strengths,
      leagueAvgGoals,
      random,
    );

    if (champion !== null) {
      championCount.set(champion, (championCount.get(champion) ?? 0) + 1);
    }

    for (const [teamId, sizes] of reached) {
      const counts = roundCounts.get(teamId)!;

      for (const size of sizes) {
        counts.set(size, (counts.get(size) ?? 0) + 1);
      }
    }
  }

  return teams.map((team) => {
    const counts = roundCounts.get(team.teamId)!;

    return {
      teamId: team.teamId,
      groupStageProbability:
        (groupStageCount.get(team.teamId) ?? 0) / iterations,
      expectedPosition: (positionSum.get(team.teamId) ?? 0) / iterations,
      roundOf16Probability:
        bracketSize < 16 ? null : (counts.get(16) ?? 0) / iterations,
      quarterFinalProbability:
        bracketSize < 8 ? null : (counts.get(8) ?? 0) / iterations,
      semiFinalProbability:
        bracketSize < 4 ? null : (counts.get(4) ?? 0) / iterations,
      finalProbability:
        bracketSize < 2 ? null : (counts.get(2) ?? 0) / iterations,
      championProbability: (championCount.get(team.teamId) ?? 0) / iterations,
    };
  });
}
