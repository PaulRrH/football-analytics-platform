import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, map, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  Role,
  UserProfile,
} from '../models';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly currentUserSignal = signal<UserProfile | null>(null);
  private refreshInProgress$: Observable<AuthTokens> | null = null;

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  login(dto: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, dto)
      .pipe(tap((res) => this.applySession(res)));
  }

  register(dto: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, dto)
      .pipe(tap((res) => this.applySession(res)));
  }

  loadCurrentUser(): Observable<UserProfile> {
    return this.http
      .get<UserProfile>(`${this.baseUrl}/me`)
      .pipe(tap((user) => this.currentUserSignal.set(user)));
  }

  refreshSession(): Observable<AuthTokens> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No hay refresh token disponible'));
    }

    if (!this.refreshInProgress$) {
      this.refreshInProgress$ = this.http
        .post<AuthResponse>(`${this.baseUrl}/refresh`, { refreshToken })
        .pipe(
          tap((res) => this.applySession(res)),
          map((res) => res.tokens),
          finalize(() => (this.refreshInProgress$ = null)),
          shareReplay(1),
        );
    }

    return this.refreshInProgress$;
  }

  logout(): void {
    const refreshToken = this.tokenStorage.getRefreshToken();
    this.tokenStorage.clear();
    this.currentUserSignal.set(null);

    if (refreshToken) {
      this.http
        .post(`${this.baseUrl}/logout`, { refreshToken })
        .subscribe({ error: () => undefined });
    }
  }

  hasAnyRole(...roles: Role[]): boolean {
    const user = this.currentUserSignal();
    return !!user && roles.includes(user.role);
  }

  private applySession(response: AuthResponse): void {
    this.tokenStorage.setTokens(response.tokens);
    this.currentUserSignal.set(response.user);
  }
}
