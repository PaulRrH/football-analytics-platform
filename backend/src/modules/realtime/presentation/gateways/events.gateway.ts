import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server } from 'socket.io';
import {
  PREDICTION_UPDATED_EVENT,
  SIMULATION_PROGRESS_EVENT,
  type PredictionUpdatedEvent,
  type SimulationProgressEvent,
} from '../../domain/realtime-events';

@WebSocketGateway({
  namespace: 'ws',
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
    credentials: true,
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  @OnEvent(PREDICTION_UPDATED_EVENT)
  handlePredictionUpdated(payload: PredictionUpdatedEvent): void {
    this.server.emit(PREDICTION_UPDATED_EVENT, payload);
  }

  @OnEvent(SIMULATION_PROGRESS_EVENT)
  handleSimulationProgress(payload: SimulationProgressEvent): void {
    this.server.emit(SIMULATION_PROGRESS_EVENT, payload);
  }
}
