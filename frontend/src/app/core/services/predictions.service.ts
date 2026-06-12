import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Prediction } from '../models';

@Injectable({ providedIn: 'root' })
export class PredictionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/predictions`;

  getMatchPredictions(matchId: string): Observable<Prediction[]> {
    return this.http.get<Prediction[]>(`${this.baseUrl}/matches/${matchId}`);
  }

  generate(matchId: string): Observable<Prediction[]> {
    return this.http.post<Prediction[]>(
      `${this.baseUrl}/matches/${matchId}/generate`,
      {},
    );
  }
}
