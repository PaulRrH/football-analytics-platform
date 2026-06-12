import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { PredictionUpdatedEvent, SimulationProgressEvent } from '../models';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private socket?: Socket;

  onPredictionUpdated(): Observable<PredictionUpdatedEvent> {
    return this.fromSocketEvent<PredictionUpdatedEvent>('prediction.updated');
  }

  onSimulationProgress(): Observable<SimulationProgressEvent> {
    return this.fromSocketEvent<SimulationProgressEvent>('simulation.progress');
  }

  private getSocket(): Socket {
    this.socket ??= io(`${environment.wsUrl}/ws`, { transports: ['websocket'] });
    return this.socket;
  }

  private fromSocketEvent<T>(event: string): Observable<T> {
    const socket = this.getSocket();

    return new Observable<T>((subscriber) => {
      const handler = (payload: T): void => subscriber.next(payload);
      socket.on(event, handler);
      return () => socket.off(event, handler);
    });
  }
}
