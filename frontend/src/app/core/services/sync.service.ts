import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProviderStatus, SyncResult } from '../models';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/sync`;

  getStatus(): Observable<ProviderStatus> {
    return this.http.get<ProviderStatus>(`${this.baseUrl}/status`);
  }

  syncCompetitions(): Observable<SyncResult> {
    return this.http.post<SyncResult>(`${this.baseUrl}/competitions`, {});
  }

  syncTeams(competitionId: string): Observable<SyncResult> {
    return this.http.post<SyncResult>(`${this.baseUrl}/competitions/${competitionId}/teams`, {});
  }

  syncMatches(competitionId: string): Observable<SyncResult> {
    return this.http.post<SyncResult>(
      `${this.baseUrl}/competitions/${competitionId}/matches`,
      {},
    );
  }
}
