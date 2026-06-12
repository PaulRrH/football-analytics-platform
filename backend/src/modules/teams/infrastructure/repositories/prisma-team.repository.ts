import { Injectable } from '@nestjs/common';
import { Prisma, Team, TeamRankingHistory } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  CountTeamsParams,
  CreateRankingHistoryData,
  CreateTeamData,
  FindAllTeamsParams,
  ITeamRepository,
  UpdateTeamData,
} from '../../domain/team-repository.interface';

@Injectable()
export class PrismaTeamRepository implements ITeamRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(params: FindAllTeamsParams): Promise<Team[]> {
    return this.prisma.team.findMany({
      where: this.buildWhere(params),
      skip: params.skip,
      take: params.take,
      orderBy: { fifaRanking: 'asc' },
    });
  }

  count(params: CountTeamsParams): Promise<number> {
    return this.prisma.team.count({ where: this.buildWhere(params) });
  }

  findById(id: string): Promise<Team | null> {
    return this.prisma.team.findUnique({ where: { id } });
  }

  findByName(name: string): Promise<Team | null> {
    return this.prisma.team.findUnique({ where: { name } });
  }

  create(data: CreateTeamData): Promise<Team> {
    return this.prisma.team.create({ data });
  }

  update(id: string, data: UpdateTeamData): Promise<Team> {
    return this.prisma.team.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.team.delete({ where: { id } });
  }

  findRankingHistory(teamId: string): Promise<TeamRankingHistory[]> {
    return this.prisma.teamRankingHistory.findMany({
      where: { teamId },
      orderBy: { recordedAt: 'asc' },
    });
  }

  recordRankingHistory(
    teamId: string,
    data: CreateRankingHistoryData,
  ): Promise<TeamRankingHistory> {
    return this.prisma.teamRankingHistory.create({
      data: { teamId, ...data },
    });
  }

  private buildWhere(
    params: CountTeamsParams,
  ): Prisma.TeamWhereInput | undefined {
    const where: Prisma.TeamWhereInput = {};

    if (params.confederation) {
      where.confederation = params.confederation;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { country: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return Object.keys(where).length > 0 ? where : undefined;
  }
}
