import { Injectable } from '@nestjs/common';
import { Competition, MatchStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  CompetitionTeamWithTeam,
  CountCompetitionsParams,
  CreateCompetitionData,
  FindAllCompetitionsParams,
  FinishedMatchResult,
  ICompetitionRepository,
  UpdateCompetitionData,
} from '../../domain/competition-repository.interface';

const TEAM_INFO_SELECT = {
  id: true,
  name: true,
  shortName: true,
  logoUrl: true,
} satisfies Prisma.TeamSelect;

@Injectable()
export class PrismaCompetitionRepository implements ICompetitionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(params: FindAllCompetitionsParams): Promise<Competition[]> {
    return this.prisma.competition.findMany({
      where: this.buildWhere(params),
      skip: params.skip,
      take: params.take,
      orderBy: { startDate: 'desc' },
    });
  }

  count(params: CountCompetitionsParams): Promise<number> {
    return this.prisma.competition.count({ where: this.buildWhere(params) });
  }

  findById(id: string): Promise<Competition | null> {
    return this.prisma.competition.findUnique({ where: { id } });
  }

  create(data: CreateCompetitionData): Promise<Competition> {
    return this.prisma.competition.create({ data });
  }

  update(id: string, data: UpdateCompetitionData): Promise<Competition> {
    return this.prisma.competition.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.competition.delete({ where: { id } });
  }

  findTeams(competitionId: string): Promise<CompetitionTeamWithTeam[]> {
    return this.prisma.competitionTeam.findMany({
      where: { competitionId },
      select: {
        teamId: true,
        groupName: true,
        team: { select: TEAM_INFO_SELECT },
      },
      orderBy: [{ groupName: 'asc' }, { seed: 'asc' }],
    });
  }

  async findFinishedMatches(
    competitionId: string,
  ): Promise<FinishedMatchResult[]> {
    const matches = await this.prisma.match.findMany({
      where: {
        competitionId,
        status: MatchStatus.FINISHED,
        homeGoals: { not: null },
        awayGoals: { not: null },
      },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeGoals: true,
        awayGoals: true,
        homeTeam: { select: TEAM_INFO_SELECT },
        awayTeam: { select: TEAM_INFO_SELECT },
      },
    });

    return matches.map((match) => ({
      ...match,
      homeGoals: match.homeGoals as number,
      awayGoals: match.awayGoals as number,
    }));
  }

  private buildWhere(
    params: CountCompetitionsParams,
  ): Prisma.CompetitionWhereInput | undefined {
    const where: Prisma.CompetitionWhereInput = {};

    if (params.type) {
      where.type = params.type;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.season) {
      where.season = params.season;
    }

    if (params.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }

    return Object.keys(where).length > 0 ? where : undefined;
  }
}
