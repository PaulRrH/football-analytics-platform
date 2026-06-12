import { Injectable } from '@nestjs/common';
import { Match, MatchStatistic, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  CountMatchesParams,
  CreateMatchData,
  FindAllMatchesParams,
  IMatchRepository,
  MATCH_DETAIL_INCLUDE,
  MATCH_LIST_INCLUDE,
  MatchListItem,
  MatchWithRelations,
  UpdateMatchData,
  UpsertMatchStatisticData,
} from '../../domain/match-repository.interface';

@Injectable()
export class PrismaMatchRepository implements IMatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(params: FindAllMatchesParams): Promise<MatchListItem[]> {
    return this.prisma.match.findMany({
      where: this.buildWhere(params),
      skip: params.skip,
      take: params.take,
      orderBy: { matchDate: 'asc' },
      include: MATCH_LIST_INCLUDE,
    });
  }

  count(params: CountMatchesParams): Promise<number> {
    return this.prisma.match.count({ where: this.buildWhere(params) });
  }

  findById(id: string): Promise<MatchWithRelations | null> {
    return this.prisma.match.findUnique({
      where: { id },
      include: MATCH_DETAIL_INCLUDE,
    });
  }

  create(data: CreateMatchData): Promise<Match> {
    return this.prisma.match.create({ data });
  }

  update(id: string, data: UpdateMatchData): Promise<Match> {
    return this.prisma.match.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.match.delete({ where: { id } });
  }

  upsertStatistic(data: UpsertMatchStatisticData): Promise<MatchStatistic> {
    const { matchId, teamId, ...stats } = data;
    return this.prisma.matchStatistic.upsert({
      where: { matchId_teamId: { matchId, teamId } },
      create: { matchId, teamId, ...stats },
      update: stats,
    });
  }

  private buildWhere(
    params: CountMatchesParams,
  ): Prisma.MatchWhereInput | undefined {
    const where: Prisma.MatchWhereInput = {};

    if (params.competitionId) {
      where.competitionId = params.competitionId;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.teamId) {
      where.OR = [{ homeTeamId: params.teamId }, { awayTeamId: params.teamId }];
    }

    if (params.dateFrom || params.dateTo) {
      where.matchDate = {
        ...(params.dateFrom ? { gte: params.dateFrom } : {}),
        ...(params.dateTo ? { lte: params.dateTo } : {}),
      };
    }

    return Object.keys(where).length > 0 ? where : undefined;
  }
}
