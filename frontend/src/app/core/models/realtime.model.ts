import { Prediction } from './prediction.model';

export interface PredictionUpdatedEvent {
  matchId: string;
  predictions: Prediction[];
}

export interface SimulationProgressEvent {
  simulationId: string;
  competitionId: string;
  status: 'COMPLETED';
  progress: number;
}
