import { SimulationStatus } from './simulation.enum';

export interface SimulationTeamSummary {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
}

export interface TeamSimulationResult {
  id: string;
  team: SimulationTeamSummary;
  groupStageProbability: number;
  expectedPosition: number | null;
  roundOf16Probability: number | null;
  quarterFinalProbability: number | null;
  semiFinalProbability: number | null;
  finalProbability: number | null;
  championProbability: number;
}

export interface SimulationResults {
  id: string;
  competitionId: string;
  iterations: number;
  status: SimulationStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  teamResults: TeamSimulationResult[];
}

export interface CreateSimulationRequest {
  competitionId: string;
  iterations?: number;
}
