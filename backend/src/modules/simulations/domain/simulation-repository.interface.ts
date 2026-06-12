import { TeamSimulationResult, TournamentSimulation } from '@prisma/client';
import type { TeamGoalAverages } from '../../predictions/domain/prediction-repository.interface';
import type { SimTeamResult } from '../application/tournament-simulator';

export const SIMULATION_REPOSITORY = 'SIMULATION_REPOSITORY';

export interface SimulationTeamInfo {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
}

export interface CompetitionGroupTeam {
  teamId: string;
  groupName: string | null;
  eloRating: number;
}

export interface GroupStageMatchData {
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number | null;
  awayGoals: number | null;
}

export type SimulationResultData = SimTeamResult;

export interface TeamSimulationResultWithTeam extends TeamSimulationResult {
  team: SimulationTeamInfo;
}

export interface TournamentSimulationWithResults extends TournamentSimulation {
  teamResults: TeamSimulationResultWithTeam[];
}

/**
 * Puerto (Repository pattern) para el agregado TournamentSimulation.
 * La implementacion concreta vive en infrastructure/repositories.
 */
export interface ISimulationRepository {
  /** `null` si la competicion no existe. */
  findCompetitionTeams(
    competitionId: string,
  ): Promise<CompetitionGroupTeam[] | null>;
  findGroupStageMatches(competitionId: string): Promise<GroupStageMatchData[]>;
  findLeagueAverageGoals(): Promise<number>;
  findTeamGoalAverages(teamId: string): Promise<TeamGoalAverages>;
  createCompleted(
    competitionId: string,
    iterations: number,
    results: SimulationResultData[],
  ): Promise<TournamentSimulationWithResults>;
  findById(id: string): Promise<TournamentSimulationWithResults | null>;
  findTeamResult(
    simulationId: string,
    teamId: string,
  ): Promise<TeamSimulationResultWithTeam | null>;
}
