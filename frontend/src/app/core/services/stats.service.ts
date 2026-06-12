import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HeadToHead, TeamForm } from '../models';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/stats`;

  getTeamForm(teamId: string): Observable<TeamForm> {
    return this.http.get<TeamForm>(`${this.baseUrl}/teams/${teamId}`);
  }

  getHeadToHead(teamAId: string, teamBId: string): Observable<HeadToHead> {
    const params = new HttpParams().set('teamA', teamAId).set('teamB', teamBId);
    return this.http.get<HeadToHead>(`${this.baseUrl}/head-to-head`, { params });
  }
}
