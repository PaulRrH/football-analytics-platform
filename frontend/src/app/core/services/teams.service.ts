import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateTeamRequest,
  PaginatedResponse,
  Team,
  TeamQuery,
  TeamRankingHistoryEntry,
  UpdateTeamRequest,
} from '../models';

@Injectable({ providedIn: 'root' })
export class TeamsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/teams`;

  findAll(query: TeamQuery = {}): Observable<PaginatedResponse<Team>> {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value);
      }
    }

    return this.http.get<PaginatedResponse<Team>>(this.baseUrl, { params });
  }

  findOne(id: string): Observable<Team> {
    return this.http.get<Team>(`${this.baseUrl}/${id}`);
  }

  getRankingHistory(id: string): Observable<TeamRankingHistoryEntry[]> {
    return this.http.get<TeamRankingHistoryEntry[]>(`${this.baseUrl}/${id}/ranking-history`);
  }

  create(dto: CreateTeamRequest): Observable<Team> {
    return this.http.post<Team>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateTeamRequest): Observable<Team> {
    return this.http.patch<Team>(`${this.baseUrl}/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
