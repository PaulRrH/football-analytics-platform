import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  type IStatsRepository,
  type StatsTeamInfo,
  STATS_REPOSITORY,
} from '../../domain/stats-repository.interface';
import { HeadToHeadMatchDto } from '../dto/head-to-head-match.dto';
import { HeadToHeadResponseDto } from '../dto/head-to-head-response.dto';
import { TeamFormMatchDto } from '../dto/team-form-match.dto';
import { TeamFormResponseDto } from '../dto/team-form-response.dto';

@Injectable()
export class StatsService {
  constructor(
    @Inject(STATS_REPOSITORY)
    private readonly statsRepository: IStatsRepository,
  ) {}

  async getTeamForm(
    teamId: string,
    limit: number,
  ): Promise<TeamFormResponseDto> {
    const team = await this.findTeamOrThrow(teamId);
    const matches = await this.statsRepository.findRecentFinishedMatches(
      teamId,
      limit,
    );

    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    const recentMatches: TeamFormMatchDto[] = matches.map((match) => {
      const isHome = match.homeTeamId === teamId;
      const teamGoals = isHome ? match.homeGoals : match.awayGoals;
      const opponentGoals = isHome ? match.awayGoals : match.homeGoals;

      goalsFor += teamGoals;
      goalsAgainst += opponentGoals;

      let result: 'W' | 'D' | 'L';
      if (teamGoals > opponentGoals) {
        result = 'W';
        wins += 1;
      } else if (teamGoals < opponentGoals) {
        result = 'L';
        losses += 1;
      } else {
        result = 'D';
        draws += 1;
      }

      return {
        id: match.id,
        matchDate: match.matchDate,
        competitionName: match.competitionName,
        opponent: isHome ? match.awayTeam : match.homeTeam,
        isHome,
        goalsFor: teamGoals,
        goalsAgainst: opponentGoals,
        result,
      };
    });

    return {
      team,
      matchesPlayed: matches.length,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      points: wins * 3 + draws,
      form: recentMatches.map((m) => m.result).reverse(),
      recentMatches,
    };
  }

  async getHeadToHead(
    teamAId: string,
    teamBId: string,
  ): Promise<HeadToHeadResponseDto> {
    if (teamAId === teamBId) {
      throw new BadRequestException('Los equipos deben ser distintos');
    }

    const [teamA, teamB] = await Promise.all([
      this.findTeamOrThrow(teamAId),
      this.findTeamOrThrow(teamBId),
    ]);

    const matches = await this.statsRepository.findHeadToHeadMatches(
      teamAId,
      teamBId,
    );

    let teamAWins = 0;
    let teamBWins = 0;
    let draws = 0;
    let teamAGoals = 0;
    let teamBGoals = 0;

    const matchDtos: HeadToHeadMatchDto[] = matches.map((match) => {
      const aGoals =
        match.homeTeamId === teamAId ? match.homeGoals : match.awayGoals;
      const bGoals =
        match.homeTeamId === teamBId ? match.homeGoals : match.awayGoals;

      teamAGoals += aGoals;
      teamBGoals += bGoals;

      if (aGoals > bGoals) {
        teamAWins += 1;
      } else if (aGoals < bGoals) {
        teamBWins += 1;
      } else {
        draws += 1;
      }

      return {
        id: match.id,
        matchDate: match.matchDate,
        competitionName: match.competitionName,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeGoals: match.homeGoals,
        awayGoals: match.awayGoals,
      };
    });

    return {
      teamA,
      teamB,
      totalMatches: matches.length,
      teamAWins,
      teamBWins,
      draws,
      teamAGoals,
      teamBGoals,
      matches: matchDtos,
    };
  }

  private async findTeamOrThrow(teamId: string): Promise<StatsTeamInfo> {
    const team = await this.statsRepository.findTeamInfo(teamId);
    if (!team) {
      throw new NotFoundException(`Equipo ${teamId} no encontrado`);
    }
    return team;
  }
}
