import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Competition,
  CompetitionQuery,
  CreateCompetitionRequest,
  PaginatedResponse,
  StandingsGroup,
  UpdateCompetitionRequest,
} from '../models';

@Injectable({ providedIn: 'root' })
export class CompetitionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/competitions`;

  findAll(query: CompetitionQuery = {}): Observable<PaginatedResponse<Competition>> {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value);
      }
    }

    return this.http.get<PaginatedResponse<Competition>>(this.baseUrl, { params });
  }

  findOne(id: string): Observable<Competition> {
    return this.http.get<Competition>(`${this.baseUrl}/${id}`);
  }

  getStandings(id: string): Observable<StandingsGroup[]> {
    return this.http.get<StandingsGroup[]>(`${this.baseUrl}/${id}/standings`);
  }

  create(dto: CreateCompetitionRequest): Observable<Competition> {
    return this.http.post<Competition>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateCompetitionRequest): Observable<Competition> {
    return this.http.patch<Competition>(`${this.baseUrl}/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
