import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  type CompetitionGroupTeam,
  type ISimulationRepository,
  type TeamSimulationResultWithTeam,
  type TournamentSimulationWithResults,
  SIMULATION_REPOSITORY,
} from '../../domain/simulation-repository.interface';
import {
  DEFAULT_ITERATIONS,
  runTournamentSimulation,
  type SimGroupMatch,
  type SimGroupTeam,
} from '../tournament-simulator';
import { CreateSimulationDto } from '../dto/create-simulation.dto';
import { SimulationResponseDto } from '../dto/simulation-response.dto';
import { SimulationResultsResponseDto } from '../dto/simulation-results-response.dto';
import { TeamSimulationResultDto } from '../dto/team-simulation-result.dto';

type GroupedTeam = CompetitionGroupTeam & { groupName: string };

@Injectable()
export class SimulationsService {
  constructor(
    @Inject(SIMULATION_REPOSITORY)
    private readonly simulationRepository: ISimulationRepository,
  ) {}

  async create(
    dto: CreateSimulationDto,
  ): Promise<SimulationResultsResponseDto> {
    const teams = await this.simulationRepository.findCompetitionTeams(
      dto.competitionId,
    );

    if (!teams) {
      throw new NotFoundException(
        `Competicion ${dto.competitionId} no encontrada`,
      );
    }

    const groupedTeams: SimGroupTeam[] = teams
      .filter((team): team is GroupedTeam => team.groupName !== null)
      .map((team) => ({
        teamId: team.teamId,
        groupName: team.groupName,
        eloRating: team.eloRating,
      }));

    if (groupedTeams.length === 0) {
      throw new BadRequestException(
        'La competición no tiene fase de grupos configurada para simular',
      );
    }

    const groupByTeamId = new Map(
      groupedTeams.map((team) => [team.teamId, team.groupName]),
    );

    const [rawMatches, leagueAvgGoals, strengthsEntries] = await Promise.all([
      this.simulationRepository.findGroupStageMatches(dto.competitionId),
      this.simulationRepository.findLeagueAverageGoals(),
      Promise.all(
        groupedTeams.map(
          async (team) =>
            [
              team.teamId,
              await this.simulationRepository.findTeamGoalAverages(team.teamId),
            ] as const,
        ),
      ),
    ]);

    const matches: SimGroupMatch[] = rawMatches
      .filter(
        (match) =>
          groupByTeamId.get(match.homeTeamId) ===
            groupByTeamId.get(match.awayTeamId) &&
          groupByTeamId.get(match.homeTeamId) !== undefined,
      )
      .map((match) => ({
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        groupName: groupByTeamId.get(match.homeTeamId)!,
        homeGoals: match.homeGoals,
        awayGoals: match.awayGoals,
      }));

    const strengths = new Map(strengthsEntries);
    const iterations = dto.iterations ?? DEFAULT_ITERATIONS;

    const results = runTournamentSimulation(
      groupedTeams,
      matches,
      strengths,
      leagueAvgGoals,
      iterations,
    );

    const saved = await this.simulationRepository.createCompleted(
      dto.competitionId,
      iterations,
      results,
    );

    return this.toResultsResponse(saved);
  }

  async getSimulation(id: string): Promise<SimulationResponseDto> {
    const simulation = await this.findSimulationOrThrow(id);
    return this.toResponse(simulation);
  }

  async getResults(id: string): Promise<SimulationResultsResponseDto> {
    const simulation = await this.findSimulationOrThrow(id);
    return this.toResultsResponse(simulation);
  }

  async getTeamResult(
    simulationId: string,
    teamId: string,
  ): Promise<TeamSimulationResultDto> {
    await this.findSimulationOrThrow(simulationId);

    const result = await this.simulationRepository.findTeamResult(
      simulationId,
      teamId,
    );

    if (!result) {
      throw new NotFoundException(
        `El equipo ${teamId} no tiene resultados en la simulacion ${simulationId}`,
      );
    }

    return this.toTeamResultDto(result);
  }

  private async findSimulationOrThrow(
    id: string,
  ): Promise<TournamentSimulationWithResults> {
    const simulation = await this.simulationRepository.findById(id);
    if (!simulation) {
      throw new NotFoundException(`Simulacion ${id} no encontrada`);
    }

    return simulation;
  }

  private toResponse(
    simulation: TournamentSimulationWithResults,
  ): SimulationResponseDto {
    return plainToInstance(SimulationResponseDto, simulation, {
      excludeExtraneousValues: true,
    });
  }

  private toResultsResponse(
    simulation: TournamentSimulationWithResults,
  ): SimulationResultsResponseDto {
    return plainToInstance(
      SimulationResultsResponseDto,
      {
        ...simulation,
        teamResults: [...simulation.teamResults].sort(
          (a, b) => b.championProbability - a.championProbability,
        ),
      },
      { excludeExtraneousValues: true },
    );
  }

  private toTeamResultDto(
    result: TeamSimulationResultWithTeam,
  ): TeamSimulationResultDto {
    return plainToInstance(TeamSimulationResultDto, result, {
      excludeExtraneousValues: true,
    });
  }
}
