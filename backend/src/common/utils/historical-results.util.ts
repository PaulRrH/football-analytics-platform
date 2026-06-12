import { CompetitionType, MatchStage } from '@prisma/client';

export interface HistoricalMatchRow {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  tournament: string;
}

/**
 * Parsea el CSV de `prisma/data/historical-matches.csv`
 * (date,home_team,away_team,home_score,away_score,tournament).
 */
export function parseHistoricalMatchesCsv(
  content: string,
): HistoricalMatchRow[] {
  const [, ...rows] = content.trim().split('\n');

  return rows.map((line) => {
    const [date, homeTeam, awayTeam, homeGoals, awayGoals, tournament] =
      line.split(',');

    return {
      date,
      homeTeam,
      awayTeam,
      homeGoals: Number(homeGoals),
      awayGoals: Number(awayGoals),
      tournament,
    };
  });
}

export function mapTournamentToCompetitionType(
  tournament: string,
): CompetitionType {
  if (tournament === 'FIFA World Cup') {
    return CompetitionType.WORLD_CUP;
  }

  if (tournament.includes('qualification')) {
    return CompetitionType.QUALIFIER;
  }

  if (tournament === 'Friendly') {
    return CompetitionType.FRIENDLY;
  }

  return CompetitionType.CONTINENTAL;
}

export function mapTournamentToMatchStage(tournament: string): MatchStage {
  if (tournament === 'Friendly') {
    return MatchStage.FRIENDLY;
  }

  if (tournament.includes('qualification')) {
    return MatchStage.QUALIFIER;
  }

  return MatchStage.GROUP_STAGE;
}
