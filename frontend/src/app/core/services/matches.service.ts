import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateMatchRequest,
  Match,
  MatchQuery,
  MatchStatistic,
  PaginatedResponse,
  UpdateMatchRequest,
  UpsertMatchStatisticRequest,
} from '../models';

@Injectable({ providedIn: 'root' })
export class MatchesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/matches`;

  findAll(query: MatchQuery = {}): Observable<PaginatedResponse<Match>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value);
      }
    }
    return this.http.get<PaginatedResponse<Match>>(this.baseUrl, { params });
  }

  findOne(id: string): Observable<Match> {
    return this.http.get<Match>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateMatchRequest): Observable<Match> {
    return this.http.post<Match>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateMatchRequest): Observable<Match> {
    return this.http.patch<Match>(`${this.baseUrl}/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  upsertStatistic(id: string, dto: UpsertMatchStatisticRequest): Observable<MatchStatistic> {
    return this.http.put<MatchStatistic>(`${this.baseUrl}/${id}/statistics`, dto);
  }
}
