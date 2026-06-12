import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexStroke,
  ApexXAxis,
  ApexYAxis,
  ChartComponent,
} from 'ng-apexcharts';
import { finalize, forkJoin } from 'rxjs';
import { Team, TeamForm, TeamRankingHistoryEntry } from '../../../core/models';
import { StatsService } from '../../../core/services/stats.service';
import { TeamsService } from '../../../core/services/teams.service';
import { resolveErrorMessage } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-team-detail',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ChartComponent,
  ],
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.scss',
})
export class TeamDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly teamsService = inject(TeamsService);
  private readonly statsService = inject(StatsService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly team = signal<Team | null>(null);
  readonly rankingHistory = signal<TeamRankingHistoryEntry[]>([]);
  readonly teamForm = signal<TeamForm | null>(null);

  readonly hasHistory = computed(() => this.rankingHistory().length > 0);

  readonly chart: ApexChart = { type: 'line', height: 320 };
  readonly stroke: ApexStroke = { curve: 'smooth', width: 2 };

  readonly yaxis: ApexYAxis[] = [
    { title: { text: 'Elo Rating' } },
    { opposite: true, reversed: true, title: { text: 'Ranking FIFA' } },
  ];

  readonly chartSeries = computed<ApexAxisChartSeries>(() => [
    { name: 'Elo Rating', data: this.rankingHistory().map((entry) => entry.eloRating) },
    { name: 'Ranking FIFA', data: this.rankingHistory().map((entry) => entry.fifaRanking ?? 0) },
  ]);

  readonly xaxis = computed<ApexXAxis>(() => ({
    categories: this.rankingHistory().map((entry) =>
      new Date(entry.recordedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' }),
    ),
  }));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    forkJoin({
      team: this.teamsService.findOne(id),
      history: this.teamsService.getRankingHistory(id),
      form: this.statsService.getTeamForm(id),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ team, history, form }) => {
          this.team.set(team);
          this.rankingHistory.set(history);
          this.teamForm.set(form);
        },
        error: (err: unknown) => {
          this.errorMessage.set(resolveErrorMessage(err, 'No se pudo cargar el equipo.'));
        },
      });
  }
}
