import {
  PrismaClient,
  Role,
  Confederation,
  CompetitionType,
  CompetitionStatus,
  MatchStage,
  MatchStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

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

// Partidos amistosos finalizados (con goles y estadisticas) para alimentar el motor estadistico
const FRIENDLY_RESULTS: Array<{
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
  daysAgo: number;
  homeStats: Partial<MatchStatInput>;
  awayStats: Partial<MatchStatInput>;
}> = [
  { home: 'Argentina', away: 'Brazil', homeGoals: 2, awayGoals: 1, daysAgo: 120, homeStats: { possession: 54, shotsTotal: 14, shotsOnTarget: 7, corners: 6, fouls: 10, passes: 480, passAccuracy: 87 }, awayStats: { possession: 46, shotsTotal: 11, shotsOnTarget: 4, corners: 4, fouls: 13, passes: 410, passAccuracy: 83 } },
  { home: 'France', away: 'England', homeGoals: 1, awayGoals: 1, daysAgo: 110, homeStats: { possession: 49, shotsTotal: 10, shotsOnTarget: 5, corners: 5, fouls: 9, passes: 450, passAccuracy: 85 }, awayStats: { possession: 51, shotsTotal: 12, shotsOnTarget: 6, corners: 7, fouls: 8, passes: 470, passAccuracy: 86 } },
  { home: 'Spain', away: 'Portugal', homeGoals: 3, awayGoals: 1, daysAgo: 100, homeStats: { possession: 60, shotsTotal: 16, shotsOnTarget: 9, corners: 8, fouls: 7, passes: 590, passAccuracy: 91 }, awayStats: { possession: 40, shotsTotal: 8, shotsOnTarget: 3, corners: 3, fouls: 11, passes: 360, passAccuracy: 80 } },
  { home: 'Germany', away: 'Netherlands', homeGoals: 2, awayGoals: 2, daysAgo: 95, homeStats: { possession: 52, shotsTotal: 13, shotsOnTarget: 6, corners: 5, fouls: 9, passes: 460, passAccuracy: 86 }, awayStats: { possession: 48, shotsTotal: 12, shotsOnTarget: 6, corners: 6, fouls: 10, passes: 430, passAccuracy: 84 } },
  { home: 'Belgium', away: 'Croatia', homeGoals: 1, awayGoals: 0, daysAgo: 90, homeStats: { possession: 55, shotsTotal: 11, shotsOnTarget: 5, corners: 4, fouls: 8, passes: 440, passAccuracy: 85 }, awayStats: { possession: 45, shotsTotal: 7, shotsOnTarget: 2, corners: 3, fouls: 12, passes: 380, passAccuracy: 81 } },
  { home: 'Uruguay', away: 'Colombia', homeGoals: 0, awayGoals: 0, daysAgo: 85, homeStats: { possession: 47, shotsTotal: 8, shotsOnTarget: 2, corners: 4, fouls: 10, passes: 400, passAccuracy: 82 }, awayStats: { possession: 53, shotsTotal: 9, shotsOnTarget: 3, corners: 5, fouls: 9, passes: 420, passAccuracy: 84 } },
  { home: 'Mexico', away: 'United States', homeGoals: 2, awayGoals: 0, daysAgo: 80, homeStats: { possession: 58, shotsTotal: 13, shotsOnTarget: 7, corners: 6, fouls: 11, passes: 470, passAccuracy: 86 }, awayStats: { possession: 42, shotsTotal: 6, shotsOnTarget: 1, corners: 2, fouls: 14, passes: 350, passAccuracy: 79 } },
  { home: 'Morocco', away: 'Senegal', homeGoals: 1, awayGoals: 1, daysAgo: 75, homeStats: { possession: 50, shotsTotal: 10, shotsOnTarget: 4, corners: 5, fouls: 9, passes: 410, passAccuracy: 83 }, awayStats: { possession: 50, shotsTotal: 9, shotsOnTarget: 4, corners: 4, fouls: 10, passes: 405, passAccuracy: 82 } },
  { home: 'Japan', away: 'Italy', homeGoals: 1, awayGoals: 2, daysAgo: 70, homeStats: { possession: 46, shotsTotal: 9, shotsOnTarget: 3, corners: 3, fouls: 8, passes: 400, passAccuracy: 84 }, awayStats: { possession: 54, shotsTotal: 12, shotsOnTarget: 6, corners: 6, fouls: 9, passes: 450, passAccuracy: 87 } },
  { home: 'Brazil', away: 'Spain', homeGoals: 1, awayGoals: 3, daysAgo: 60, homeStats: { possession: 45, shotsTotal: 10, shotsOnTarget: 4, corners: 4, fouls: 10, passes: 420, passAccuracy: 84 }, awayStats: { possession: 55, shotsTotal: 15, shotsOnTarget: 8, corners: 7, fouls: 8, passes: 540, passAccuracy: 90 } },
  { home: 'Argentina', away: 'France', homeGoals: 1, awayGoals: 0, daysAgo: 45, homeStats: { possession: 51, shotsTotal: 11, shotsOnTarget: 5, corners: 5, fouls: 9, passes: 440, passAccuracy: 85 }, awayStats: { possession: 49, shotsTotal: 9, shotsOnTarget: 3, corners: 4, fouls: 10, passes: 425, passAccuracy: 83 } },
  { home: 'England', away: 'Netherlands', homeGoals: 2, awayGoals: 1, daysAgo: 30, homeStats: { possession: 52, shotsTotal: 12, shotsOnTarget: 6, corners: 6, fouls: 8, passes: 455, passAccuracy: 86 }, awayStats: { possession: 48, shotsTotal: 10, shotsOnTarget: 4, corners: 4, fouls: 9, passes: 415, passAccuracy: 83 } },
];

interface MatchStatInput {
  possession: number;
  shotsTotal: number;
  shotsOnTarget: number;
  corners: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  passes: number;
  passAccuracy: number;
  offsides: number;
}

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

async function seedUsers() {
  const users = [
    { email: 'admin@worldcup-analytics.com', fullName: 'Super Administrador', role: Role.SUPER_ADMIN, password: 'Admin123!' },
    { email: 'analyst@worldcup-analytics.com', fullName: 'Analista de Datos', role: Role.ANALYST, password: 'Analyst123!' },
    { email: 'user@worldcup-analytics.com', fullName: 'Usuario Demo', role: Role.USER, password: 'User123!' },
  ];

  for (const u of users) {
    await prisma.user.create({
      data: {
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        passwordHash: await hashPassword(u.password),
      },
    });
  }

  console.log(`Usuarios creados: ${users.length}`);
}

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
  const now = new Date();

  const friendlyCompetition = await prisma.competition.create({
    data: {
      name: 'Fecha FIFA - Amistosos Internacionales 2025',
      type: CompetitionType.FRIENDLY,
      season: '2025',
      startDate: new Date(now.getFullYear() - 1, 0, 1),
      endDate: new Date(now.getFullYear() - 1, 11, 31),
      status: CompetitionStatus.FINISHED,
    },
  });

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

  console.log('Competiciones creadas: 2');
  return { friendlyCompetition, worldCup };
}

async function seedFriendlyMatches(
  idByName: Map<string, string>,
  competitionId: string,
) {
  const now = new Date();

  for (const result of FRIENDLY_RESULTS) {
    const matchDate = new Date(now);
    matchDate.setDate(matchDate.getDate() - result.daysAgo);

    const match = await prisma.match.create({
      data: {
        competitionId,
        homeTeamId: idByName.get(result.home)!,
        awayTeamId: idByName.get(result.away)!,
        matchDate,
        venue: 'Estadio Neutral',
        city: 'Ciudad Sede',
        stage: MatchStage.FRIENDLY,
        round: 'Amistoso',
        homeGoals: result.homeGoals,
        awayGoals: result.awayGoals,
        status: MatchStatus.FINISHED,
      },
    });

    await prisma.matchStatistic.create({
      data: {
        matchId: match.id,
        teamId: idByName.get(result.home)!,
        yellowCards: 1,
        redCards: 0,
        offsides: 1,
        ...result.homeStats,
      } as never,
    });

    await prisma.matchStatistic.create({
      data: {
        matchId: match.id,
        teamId: idByName.get(result.away)!,
        yellowCards: 2,
        redCards: 0,
        offsides: 2,
        ...result.awayStats,
      } as never,
    });
  }

  console.log(`Partidos amistosos creados: ${FRIENDLY_RESULTS.length}`);
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
  await prisma.refreshToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log('Limpiando base de datos...');
  await cleanDatabase();

  console.log('Sembrando datos...');
  await seedUsers();
  const idByName = await seedTeams();
  await seedRankingHistory(idByName);
  const { friendlyCompetition, worldCup } = await seedCompetitions(idByName);
  await seedFriendlyMatches(idByName, friendlyCompetition.id);
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
