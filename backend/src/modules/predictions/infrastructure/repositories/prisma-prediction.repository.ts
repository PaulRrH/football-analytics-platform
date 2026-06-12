import { Injectable } from '@nestjs/common';
import { MatchStatus, Prediction } from '@prisma/client';
import { DEFAULT_LEAGUE_AVERAGE_GOALS } from '../../../../common/utils/poisson.util';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  CreatePredictionData,
  IPredictionRepository,
  MatchEloContext,
  TeamGoalAverages,
} from '../../domain/prediction-repository.interface';

const FINISHED_MATCH_WITH_GOALS = {
  status: MatchStatus.FINISHED,
  homeGoals: { not: null },
  awayGoals: { not: null },
} as const;

@Injectable()
export class PrismaPredictionRepository implements IPredictionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMatchEloContext(matchId: string): Promise<MatchEloContext | null> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        homeTeamId: true,
        awayTeamId: true,
        homeTeam: { select: { eloRating: true } },
        awayTeam: { select: { eloRating: true } },
      },
    });

    if (!match) {
      return null;
    }

    return {
      id: match.id,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeTeamEloRating: match.homeTeam.eloRating,
      awayTeamEloRating: match.awayTeam.eloRating,
    };
  }

  async findLeagueAverageGoals(): Promise<number> {
    const aggregate = await this.prisma.match.aggregate({
      where: FINISHED_MATCH_WITH_GOALS,
      _sum: { homeGoals: true, awayGoals: true },
      _count: true,
    });

    if (aggregate._count === 0) {
      return DEFAULT_LEAGUE_AVERAGE_GOALS;
    }

    const totalGoals =
      (aggregate._sum.homeGoals ?? 0) + (aggregate._sum.awayGoals ?? 0);

    return totalGoals / (aggregate._count * 2);
  }

  async findTeamGoalAverages(teamId: string): Promise<TeamGoalAverages> {
    const [homeMatches, awayMatches] = await Promise.all([
      this.prisma.match.findMany({
        where: { ...FINISHED_MATCH_WITH_GOALS, homeTeamId: teamId },
        select: { homeGoals: true, awayGoals: true },
      }),
      this.prisma.match.findMany({
        where: { ...FINISHED_MATCH_WITH_GOALS, awayTeamId: teamId },
        select: { homeGoals: true, awayGoals: true },
      }),
    ]);

    const totalMatches = homeMatches.length + awayMatches.length;
    if (totalMatches === 0) {
      return { attackFor: 1, attackAgainst: 1 };
    }

    const goalsFor =
      homeMatches.reduce((sum, m) => sum + (m.homeGoals ?? 0), 0) +
      awayMatches.reduce((sum, m) => sum + (m.awayGoals ?? 0), 0);
    const goalsAgainst =
      homeMatches.reduce((sum, m) => sum + (m.awayGoals ?? 0), 0) +
      awayMatches.reduce((sum, m) => sum + (m.homeGoals ?? 0), 0);

    return {
      attackFor: goalsFor / totalMatches,
      attackAgainst: goalsAgainst / totalMatches,
    };
  }

  findLatestPredictions(matchId: string): Promise<Prediction[]> {
    return this.prisma.prediction.findMany({
      where: { matchId },
      orderBy: { generatedAt: 'desc' },
    });
  }

  createMany(data: CreatePredictionData[]): Promise<Prediction[]> {
    return Promise.all(
      data.map((item) => this.prisma.prediction.create({ data: item })),
    );
  }
}
