import { Injectable } from '@nestjs/common';
import { MatchStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  IStatsRepository,
  StatsMatchResult,
  StatsTeamInfo,
} from '../../domain/stats-repository.interface';

const TEAM_INFO_SELECT = {
  id: true,
  name: true,
  shortName: true,
  logoUrl: true,
} satisfies Prisma.TeamSelect;

const MATCH_RESULT_SELECT = {
  id: true,
  matchDate: true,
  homeTeamId: true,
  awayTeamId: true,
  homeGoals: true,
  awayGoals: true,
  homeTeam: { select: TEAM_INFO_SELECT },
  awayTeam: { select: TEAM_INFO_SELECT },
  competition: { select: { name: true } },
} satisfies Prisma.MatchSelect;

type MatchResultPayload = Prisma.MatchGetPayload<{
  select: typeof MATCH_RESULT_SELECT;
}>;

@Injectable()
export class PrismaStatsRepository implements IStatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTeamInfo(teamId: string): Promise<StatsTeamInfo | null> {
    return this.prisma.team.findUnique({
      where: { id: teamId },
      select: TEAM_INFO_SELECT,
    });
  }

  async findRecentFinishedMatches(
    teamId: string,
    limit: number,
  ): Promise<StatsMatchResult[]> {
    const matches = await this.prisma.match.findMany({
      where: {
        status: MatchStatus.FINISHED,
        homeGoals: { not: null },
        awayGoals: { not: null },
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      },
      orderBy: { matchDate: 'desc' },
      take: limit,
      select: MATCH_RESULT_SELECT,
    });

    return matches.map((match) => this.toMatchResult(match));
  }

  async findHeadToHeadMatches(
    teamAId: string,
    teamBId: string,
  ): Promise<StatsMatchResult[]> {
    const matches = await this.prisma.match.findMany({
      where: {
        status: MatchStatus.FINISHED,
        homeGoals: { not: null },
        awayGoals: { not: null },
        OR: [
          { homeTeamId: teamAId, awayTeamId: teamBId },
          { homeTeamId: teamBId, awayTeamId: teamAId },
        ],
      },
      orderBy: { matchDate: 'desc' },
      select: MATCH_RESULT_SELECT,
    });

    return matches.map((match) => this.toMatchResult(match));
  }

  private toMatchResult(match: MatchResultPayload): StatsMatchResult {
    return {
      id: match.id,
      matchDate: match.matchDate,
      competitionName: match.competition.name,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeGoals: match.homeGoals as number,
      awayGoals: match.awayGoals as number,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
    };
  }
}
