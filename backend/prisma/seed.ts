import * as fs from 'fs';
import * as path from 'path';
import {
  PrismaClient,
  Confederation,
  CompetitionType,
  CompetitionStatus,
  MatchStage,
  MatchStatus,
} from '@prisma/client';
import {
  type HistoricalMatchRow,
  mapTournamentToCompetitionType,
  mapTournamentToMatchStage,
  parseHistoricalMatchesCsv,
} from '../src/common/utils/historical-results.util';

const prisma = new PrismaClient();

interface TeamSeed {
  name: string;
  shortName: string;
  country: string;
  confederation: Confederation;
  fifaRanking: number;
  fifaRankingPoints: number;
  eloRating: number;
  foundedYear: number;
  logoUrl: string;
}

const TEAMS: TeamSeed[] = [
  { name: 'Argentina', shortName: 'ARG', country: 'Argentina', confederation: Confederation.CONMEBOL, fifaRanking: 1, fifaRankingPoints: 1869.4, eloRating: 2106, foundedYear: 1893, logoUrl: 'https://flagcdn.com/w80/ar.png' },
  { name: 'France', shortName: 'FRA', country: 'Francia', confederation: Confederation.UEFA, fifaRanking: 2, fifaRankingPoints: 1854.6, eloRating: 2050, foundedYear: 1919, logoUrl: 'https://flagcdn.com/w80/fr.png' },
  { name: 'Spain', shortName: 'ESP', country: 'España', confederation: Confederation.UEFA, fifaRanking: 3, fifaRankingPoints: 1843.3, eloRating: 2070, foundedYear: 1913, logoUrl: 'https://flagcdn.com/w80/es.png' },
  { name: 'England', shortName: 'ENG', country: 'Inglaterra', confederation: Confederation.UEFA, fifaRanking: 4, fifaRankingPoints: 1819.2, eloRating: 2010, foundedYear: 1863, logoUrl: 'https://flagcdn.com/w80/gb-eng.png' },
  { name: 'Brazil', shortName: 'BRA', country: 'Brasil', confederation: Confederation.CONMEBOL, fifaRanking: 5, fifaRankingPoints: 1776.0, eloRating: 2040, foundedYear: 1914, logoUrl: 'https://flagcdn.com/w80/br.png' },
  { name: 'Portugal', shortName: 'POR', country: 'Portugal', confederation: Confederation.UEFA, fifaRanking: 6, fifaRankingPoints: 1768.4, eloRating: 1990, foundedYear: 1914, logoUrl: 'https://flagcdn.com/w80/pt.png' },
  { name: 'Netherlands', shortName: 'NED', country: 'Países Bajos', confederation: Confederation.UEFA, fifaRanking: 7, fifaRankingPoints: 1755.5, eloRating: 1980, foundedYear: 1889, logoUrl: 'https://flagcdn.com/w80/nl.png' },
  { name: 'Belgium', shortName: 'BEL', country: 'Bélgica', confederation: Confederation.UEFA, fifaRanking: 8, fifaRankingPoints: 1735.8, eloRating: 1960, foundedYear: 1895, logoUrl: 'https://flagcdn.com/w80/be.png' },
  { name: 'Germany', shortName: 'GER', country: 'Alemania', confederation: Confederation.UEFA, fifaRanking: 9, fifaRankingPoints: 1716.9, eloRating: 1970, foundedYear: 1900, logoUrl: 'https://flagcdn.com/w80/de.png' },
  { name: 'Croatia', shortName: 'CRO', country: 'Croacia', confederation: Confederation.UEFA, fifaRanking: 10, fifaRankingPoints: 1715.6, eloRating: 1940, foundedYear: 1912, logoUrl: 'https://flagcdn.com/w80/hr.png' },
  { name: 'Italy', shortName: 'ITA', country: 'Italia', confederation: Confederation.UEFA, fifaRanking: 11, fifaRankingPoints: 1712.0, eloRating: 1950, foundedYear: 1898, logoUrl: 'https://flagcdn.com/w80/it.png' },
  { name: 'Colombia', shortName: 'COL', country: 'Colombia', confederation: Confederation.CONMEBOL, fifaRanking: 12, fifaRankingPoints: 1705.0, eloRating: 1920, foundedYear: 1924, logoUrl: 'https://flagcdn.com/w80/co.png' },
  { name: 'Morocco', shortName: 'MAR', country: 'Marruecos', confederation: Confederation.CAF, fifaRanking: 13, fifaRankingPoints: 1699.6, eloRating: 1910, foundedYear: 1955, logoUrl: 'https://flagcdn.com/w80/ma.png' },
  { name: 'Uruguay', shortName: 'URU', country: 'Uruguay', confederation: Confederation.CONMEBOL, fifaRanking: 14, fifaRankingPoints: 1697.0, eloRating: 1930, foundedYear: 1900, logoUrl: 'https://flagcdn.com/w80/uy.png' },
  { name: 'Mexico', shortName: 'MEX', country: 'México', confederation: Confederation.CONCACAF, fifaRanking: 15, fifaRankingPoints: 1683.0, eloRating: 1860, foundedYear: 1927, logoUrl: 'https://flagcdn.com/w80/mx.png' },
  { name: 'United States', shortName: 'USA', country: 'Estados Unidos', confederation: Confederation.CONCACAF, fifaRanking: 16, fifaRankingPoints: 1675.0, eloRating: 1850, foundedYear: 1913, logoUrl: 'https://flagcdn.com/w80/us.png' },
  { name: 'Japan', shortName: 'JPN', country: 'Japón', confederation: Confederation.AFC, fifaRanking: 17, fifaRankingPoints: 1652.0, eloRating: 1880, foundedYear: 1921, logoUrl: 'https://flagcdn.com/w80/jp.png' },
  { name: 'Senegal', shortName: 'SEN', country: 'Senegal', confederation: Confederation.CAF, fifaRanking: 18, fifaRankingPoints: 1645.0, eloRating: 1870, foundedYear: 1960, logoUrl: 'https://flagcdn.com/w80/sn.png' },
];

// Grupos de la fase de grupos demo del Mundial 2026 (6 grupos de 3 equipos)
const GROUPS: string[][] = [
  ['Argentina', 'Mexico', 'Japan'],
  ['France', 'Morocco', 'United States'],
  ['Spain', 'Colombia', 'Senegal'],
  ['England', 'Croatia', 'Uruguay'],
  ['Brazil', 'Portugal', 'Italy'],
  ['Netherlands', 'Belgium', 'Germany'],
];

async function seedTeams(): Promise<Map<string, string>> {
  const idByName = new Map<string, string>();

  for (const team of TEAMS) {
    const created = await prisma.team.create({ data: team });
    idByName.set(team.name, created.id);
  }

  console.log(`Equipos creados: ${TEAMS.length}`);
  return idByName;
}

async function seedRankingHistory(idByName: Map<string, string>) {
  const now = new Date();
  let count = 0;

  for (const team of TEAMS) {
    // 6 snapshots mensuales hasta llegar al rating actual
    for (let monthsAgo = 6; monthsAgo >= 1; monthsAgo--) {
      const recordedAt = new Date(now);
      recordedAt.setMonth(recordedAt.getMonth() - monthsAgo);

      const drift = (Math.sin(monthsAgo + team.eloRating) * 15) - monthsAgo * 2;
      const eloRating = Math.round((team.eloRating + drift) * 10) / 10;
      const fifaRanking = Math.max(1, team.fifaRanking + Math.round(Math.sin(monthsAgo) * 2));

      await prisma.teamRankingHistory.create({
        data: {
          teamId: idByName.get(team.name)!,
          fifaRanking,
          fifaPoints: team.fifaRankingPoints - monthsAgo * 1.5,
          eloRating,
          recordedAt,
        },
      });
      count++;
    }
  }

  console.log(`Historial de ranking creado: ${count} registros`);
}

async function seedCompetitions(idByName: Map<string, string>) {
  const worldCup = await prisma.competition.create({
    data: {
      name: 'FIFA World Cup 2026',
      type: CompetitionType.WORLD_CUP,
      season: '2026',
      startDate: new Date('2026-06-11'),
      endDate: new Date('2026-07-19'),
      status: CompetitionStatus.ONGOING,
    },
  });

  // Inscribir equipos al Mundial 2026 con sus grupos
  let groupIndex = 0;
  for (const group of GROUPS) {
    const groupName = `Grupo ${String.fromCharCode(65 + groupIndex)}`;
    let seed = 1;
    for (const teamName of group) {
      await prisma.competitionTeam.create({
        data: {
          competitionId: worldCup.id,
          teamId: idByName.get(teamName)!,
          groupName,
          seed,
        },
      });
      seed++;
    }
    groupIndex++;
  }

  console.log('Competición Mundial 2026 creada');
  return { worldCup };
}

// Carga el historial real de partidos entre los equipos del seed
// (fuente: martj42/international_results, CC0).
async function seedHistoricalMatches(idByName: Map<string, string>) {
  const csvPath = path.join(__dirname, 'data', 'historical-matches.csv');
  const rows = parseHistoricalMatchesCsv(fs.readFileSync(csvPath, 'utf-8'));

  const rowsByTournament = new Map<string, HistoricalMatchRow[]>();
  for (const row of rows) {
    const tournamentRows = rowsByTournament.get(row.tournament) ?? [];
    tournamentRows.push(row);
    rowsByTournament.set(row.tournament, tournamentRows);
  }

  const competitionIdByTournament = new Map<string, string>();
  for (const [tournament, tournamentRows] of rowsByTournament) {
    const dates = tournamentRows.map((row) => new Date(row.date).getTime());
    const startDate = new Date(Math.min(...dates));
    const endDate = new Date(Math.max(...dates));

    const competition = await prisma.competition.create({
      data: {
        name: tournament,
        type: mapTournamentToCompetitionType(tournament),
        season: `${startDate.getUTCFullYear()}-${endDate.getUTCFullYear()}`,
        startDate,
        endDate,
        status: CompetitionStatus.FINISHED,
      },
    });

    competitionIdByTournament.set(tournament, competition.id);
  }

  await prisma.match.createMany({
    data: rows.map((row) => ({
      competitionId: competitionIdByTournament.get(row.tournament)!,
      homeTeamId: idByName.get(row.homeTeam)!,
      awayTeamId: idByName.get(row.awayTeam)!,
      matchDate: new Date(row.date),
      stage: mapTournamentToMatchStage(row.tournament),
      homeGoals: row.homeGoals,
      awayGoals: row.awayGoals,
      status: MatchStatus.FINISHED,
    })),
  });

  console.log(`Competiciones históricas creadas: ${rowsByTournament.size}`);
  console.log(`Partidos históricos importados: ${rows.length}`);
}

async function seedWorldCupMatches(idByName: Map<string, string>, competitionId: string) {
  const baseDate = new Date('2026-06-11');
  let dayOffset = 0;
  let created = 0;

  for (const group of GROUPS) {
    const [teamA, teamB, teamC] = group;
    const pairs: Array<[string, string]> = [
      [teamA, teamB],
      [teamB, teamC],
      [teamC, teamA],
    ];

    for (const [home, away] of pairs) {
      const matchDate = new Date(baseDate);
      matchDate.setDate(matchDate.getDate() + dayOffset);

      await prisma.match.create({
        data: {
          competitionId,
          homeTeamId: idByName.get(home)!,
          awayTeamId: idByName.get(away)!,
          matchDate,
          venue: 'Estadio del Mundial',
          city: 'Ciudad Sede',
          stage: MatchStage.GROUP_STAGE,
          round: 'Fase de Grupos - Jornada 1',
          status: MatchStatus.SCHEDULED,
        },
      });
      created++;
      dayOffset++;
    }
  }

  console.log(`Partidos del Mundial 2026 creados: ${created}`);
}

async function cleanDatabase() {
  await prisma.teamSimulationResult.deleteMany();
  await prisma.tournamentSimulation.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.matchStatistic.deleteMany();
  await prisma.match.deleteMany();
  await prisma.competitionTeam.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.teamRankingHistory.deleteMany();
  await prisma.team.deleteMany();
}

async function main() {
  console.log('Limpiando base de datos...');
  await cleanDatabase();

  console.log('Sembrando datos...');
  const idByName = await seedTeams();
  await seedRankingHistory(idByName);
  const { worldCup } = await seedCompetitions(idByName);
  await seedHistoricalMatches(idByName);
  await seedWorldCupMatches(idByName, worldCup.id);

  console.log('Seed completado.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
