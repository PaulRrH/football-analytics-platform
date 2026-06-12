import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateSimulationRequest, SimulationResults } from '../models';

@Injectable({ providedIn: 'root' })
export class SimulationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/simulations`;

  create(dto: CreateSimulationRequest): Observable<SimulationResults> {
    return this.http.post<SimulationResults>(this.baseUrl, dto);
  }

  getResults(simulationId: string): Observable<SimulationResults> {
    return this.http.get<SimulationResults>(`${this.baseUrl}/${simulationId}/results`);
  }
}
