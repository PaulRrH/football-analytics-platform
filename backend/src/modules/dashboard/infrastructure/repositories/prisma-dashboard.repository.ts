import { Injectable } from '@nestjs/common';
import { MatchStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  type DashboardCounts,
  type DashboardMatchesByStatus,
  type DashboardMatchInfo,
  type DashboardTeamInfo,
  type IDashboardRepository,
  type RankedTeam,
} from '../../domain/dashboard-repository.interface';

const TEAM_INFO_SELECT = {
  id: true,
  name: true,
  shortName: true,
  logoUrl: true,
  eloRating: true,
  fifaRanking: true,
} satisfies Prisma.TeamSelect;

const TEAM_REF_SELECT = {
  id: true,
  name: true,
  shortName: true,
  logoUrl: true,
} satisfies Prisma.TeamSelect;

const MATCH_INFO_SELECT = {
  id: true,
  matchDate: true,
  stage: true,
  homeGoals: true,
  awayGoals: true,
  homeTeam: { select: TEAM_REF_SELECT },
  awayTeam: { select: TEAM_REF_SELECT },
  competition: { select: { id: true, name: true } },
} satisfies Prisma.MatchSelect;

const RANKED_TEAM_SELECT = {
  id: true,
  name: true,
  shortName: true,
  logoUrl: true,
  eloRating: true,
  fifaRanking: true,
  confederation: true,
} satisfies Prisma.TeamSelect;

@Injectable()
export class PrismaDashboardRepository implements IDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCounts(): Promise<DashboardCounts> {
    const [teams, competitions, matches, predictions, simulations] =
      await Promise.all([
        this.prisma.team.count(),
        this.prisma.competition.count(),
        this.prisma.match.count(),
        this.prisma.prediction.count(),
        this.prisma.tournamentSimulation.count(),
      ]);

    return { teams, competitions, matches, predictions, simulations };
  }

  async getMatchesByStatus(): Promise<DashboardMatchesByStatus> {
    const [scheduled, live, finished, postponed, cancelled] = await Promise.all(
      [
        this.prisma.match.count({ where: { status: MatchStatus.SCHEDULED } }),
        this.prisma.match.count({ where: { status: MatchStatus.LIVE } }),
        this.prisma.match.count({ where: { status: MatchStatus.FINISHED } }),
        this.prisma.match.count({
          where: { status: MatchStatus.POSTPONED },
        }),
        this.prisma.match.count({
          where: { status: MatchStatus.CANCELLED },
        }),
      ],
    );

    return { scheduled, live, finished, postponed, cancelled };
  }

  findTopTeamsByElo(limit: number): Promise<DashboardTeamInfo[]> {
    return this.prisma.team.findMany({
      orderBy: { eloRating: 'desc' },
      take: limit,
      select: TEAM_INFO_SELECT,
    });
  }

  findUpcomingMatches(limit: number): Promise<DashboardMatchInfo[]> {
    return this.prisma.match.findMany({
      where: { status: MatchStatus.SCHEDULED },
      orderBy: { matchDate: 'asc' },
      take: limit,
      select: MATCH_INFO_SELECT,
    });
  }

  findRecentResults(limit: number): Promise<DashboardMatchInfo[]> {
    return this.prisma.match.findMany({
      where: { status: MatchStatus.FINISHED },
      orderBy: { matchDate: 'desc' },
      take: limit,
      select: MATCH_INFO_SELECT,
    });
  }

  async findRankedTeams(
    skip: number,
    take: number,
  ): Promise<{ data: RankedTeam[]; total: number }> {
    const [data, total] = await Promise.all([
      this.prisma.team.findMany({
        orderBy: { eloRating: 'desc' },
        skip,
        take,
        select: RANKED_TEAM_SELECT,
      }),
      this.prisma.team.count(),
    ]);

    return { data, total };
  }
}
