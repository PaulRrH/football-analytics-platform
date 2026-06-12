import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
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
            loadComponent: () =>
              import('./features/teams/team-form/team-form').then((m) => m.TeamForm),
          },
          {
            path: ':id/edit',
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
        path: 'competitions',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/competitions/competition-list/competition-list').then(
                (m) => m.CompetitionList,
              ),
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./features/competitions/competition-form/competition-form').then(
                (m) => m.CompetitionForm,
              ),
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./features/competitions/competition-form/competition-form').then(
                (m) => m.CompetitionForm,
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/competitions/competition-detail/competition-detail').then(
                (m) => m.CompetitionDetail,
              ),
          },
        ],
      },
      {
        path: 'head-to-head',
        loadComponent: () =>
          import('./features/stats/head-to-head/head-to-head').then((m) => m.HeadToHead),
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
            loadComponent: () =>
              import('./features/matches/match-form/match-form').then((m) => m.MatchForm),
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./features/matches/match-form/match-form').then((m) => m.MatchForm),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/matches/match-detail/match-detail').then((m) => m.MatchDetail),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
