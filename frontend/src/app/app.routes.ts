import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { Role } from './core/models';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./layout/auth-layout/auth-layout').then((m) => m.AuthLayout),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'teams',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/teams/team-list/team-list').then((m) => m.TeamList),
          },
          {
            path: 'new',
            canActivate: [roleGuard(Role.ANALYST, Role.SUPER_ADMIN)],
            loadComponent: () =>
              import('./features/teams/team-form/team-form').then((m) => m.TeamForm),
          },
          {
            path: ':id/edit',
            canActivate: [roleGuard(Role.ANALYST, Role.SUPER_ADMIN)],
            loadComponent: () =>
              import('./features/teams/team-form/team-form').then((m) => m.TeamForm),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/teams/team-detail/team-detail').then((m) => m.TeamDetail),
          },
        ],
      },
      {
        path: 'matches',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/matches/match-list/match-list').then((m) => m.MatchList),
          },
          {
            path: 'new',
            canActivate: [roleGuard(Role.ANALYST, Role.SUPER_ADMIN)],
            loadComponent: () =>
              import('./features/matches/match-form/match-form').then((m) => m.MatchForm),
          },
          {
            path: ':id/edit',
            canActivate: [roleGuard(Role.ANALYST, Role.SUPER_ADMIN)],
            loadComponent: () =>
              import('./features/matches/match-form/match-form').then((m) => m.MatchForm),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'auth/login' },
];
