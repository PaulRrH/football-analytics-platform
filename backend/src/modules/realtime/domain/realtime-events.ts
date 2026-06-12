import type { PredictionResponseDto } from '../../predictions/application/dto/prediction-response.dto';

export const PREDICTION_UPDATED_EVENT = 'prediction.updated';
export const SIMULATION_PROGRESS_EVENT = 'simulation.progress';

export interface PredictionUpdatedEvent {
  matchId: string;
  predictions: PredictionResponseDto[];
}

export interface SimulationProgressEvent {
  simulationId: string;
  competitionId: string;
  status: 'COMPLETED';
  progress: number;
}
