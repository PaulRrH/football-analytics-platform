import { Injectable } from '@nestjs/common';
import { MatchStage, MatchStatus, SimulationStatus } from '@prisma/client';
import { DEFAULT_LEAGUE_AVERAGE_GOALS } from '../../../../common/utils/poisson.util';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type { TeamGoalAverages } from '../../../predictions/domain/prediction-repository.interface';
import {
  type CompetitionGroupTeam,
  type GroupStageMatchData,
  type ISimulationRepository,
  type SimulationResultData,
  type TeamSimulationResultWithTeam,
  type TournamentSimulationWithResults,
} from '../../domain/simulation-repository.interface';

const FINISHED_MATCH_WITH_GOALS = {
  status: MatchStatus.FINISHED,
  homeGoals: { not: null },
  awayGoals: { not: null },
} as const;

const TEAM_SUMMARY_SELECT = {
  id: true,
  name: true,
  shortName: true,
  logoUrl: true,
} as const;

@Injectable()
export class PrismaSimulationRepository implements ISimulationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCompetitionTeams(
    competitionId: string,
  ): Promise<CompetitionGroupTeam[] | null> {
    const competition = await this.prisma.competition.findUnique({
      where: { id: competitionId },
      select: { id: true },
    });

    if (!competition) {
      return null;
    }

    const teams = await this.prisma.competitionTeam.findMany({
      where: { competitionId },
      select: {
        teamId: true,
        groupName: true,
        team: { select: { eloRating: true } },
      },
    });

    return teams.map((team) => ({
      teamId: team.teamId,
      groupName: team.groupName,
      eloRating: team.team.eloRating,
    }));
  }

  findGroupStageMatches(competitionId: string): Promise<GroupStageMatchData[]> {
    return this.prisma.match.findMany({
      where: { competitionId, stage: MatchStage.GROUP_STAGE },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeGoals: true,
        awayGoals: true,
      },
    });
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

  createCompleted(
    competitionId: string,
    iterations: number,
    results: SimulationResultData[],
  ): Promise<TournamentSimulationWithResults> {
    const now = new Date();

    return this.prisma.tournamentSimulation.create({
      data: {
        competitionId,
        iterations,
        status: SimulationStatus.COMPLETED,
        startedAt: now,
        completedAt: now,
        teamResults: {
          create: results.map((result) => ({
            teamId: result.teamId,
            groupStageProbability: result.groupStageProbability,
            roundOf16Probability: result.roundOf16Probability,
            quarterFinalProbability: result.quarterFinalProbability,
            semiFinalProbability: result.semiFinalProbability,
            finalProbability: result.finalProbability,
            championProbability: result.championProbability,
            expectedPosition: result.expectedPosition,
          })),
        },
      },
      include: {
        teamResults: { include: { team: { select: TEAM_SUMMARY_SELECT } } },
      },
    });
  }

  findById(id: string): Promise<TournamentSimulationWithResults | null> {
    return this.prisma.tournamentSimulation.findUnique({
      where: { id },
      include: {
        teamResults: { include: { team: { select: TEAM_SUMMARY_SELECT } } },
      },
    });
  }

  findTeamResult(
    simulationId: string,
    teamId: string,
  ): Promise<TeamSimulationResultWithTeam | null> {
    return this.prisma.teamSimulationResult.findUnique({
      where: { simulationId_teamId: { simulationId, teamId } },
      include: { team: { select: TEAM_SUMMARY_SELECT } },
    });
  }
}
