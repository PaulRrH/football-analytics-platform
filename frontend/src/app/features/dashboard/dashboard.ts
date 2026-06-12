import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexXAxis,
  ChartComponent,
} from 'ng-apexcharts';
import { finalize } from 'rxjs';
import { DashboardRanking, DashboardSummary } from '../../core/models';
import { DashboardService } from '../../core/services/dashboard.service';
import { RealtimeService } from '../../core/services/realtime.service';
import { resolveErrorMessage } from '../../core/utils/http-error.util';

const RANKING_PAGE_SIZE_OPTIONS = [10, 25, 50];
const ACTIVITY_LIMIT = 10;
const MATCH_STATUS_LABELS = [
  'Programados',
  'En vivo',
  'Finalizados',
  'Postpuestos',
  'Cancelados',
];

interface ActivityEntry {
  id: number;
  type: 'prediction' | 'simulation';
  message: string;
  timestamp: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    MatCardModule,
    MatListModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    ChartComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly realtimeService = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly summary = signal<DashboardSummary | null>(null);

  readonly rankings = signal<DashboardRanking[]>([]);
  readonly rankingsTotal = signal(0);
  readonly rankingsPage = signal(1);
  readonly rankingsLimit = signal(10);
  readonly rankingsLoading = signal(true);
  readonly rankingsError = signal<string | null>(null);
  readonly rankingPageSizeOptions = RANKING_PAGE_SIZE_OPTIONS;

  readonly activity = signal<ActivityEntry[]>([]);
  private activityCounter = 0;

  readonly eloChart: ApexChart = { type: 'bar', height: 420 };
  readonly eloPlotOptions: ApexPlotOptions = {
    bar: { horizontal: true, borderRadius: 4, distributed: true },
  };
  readonly eloDataLabels: ApexDataLabels = { enabled: true };

  readonly eloSeries = computed<ApexAxisChartSeries>(() => [
    {
      name: 'Elo Rating',
      data: (this.summary()?.topTeams ?? []).map((team) => team.eloRating),
    },
  ]);

  readonly eloXaxis = computed<ApexXAxis>(() => ({
    categories: (this.summary()?.topTeams ?? []).map((team) => team.name),
  }));

  readonly statusChart: ApexChart = { type: 'donut', height: 320 };
  readonly statusLabels = MATCH_STATUS_LABELS;
  readonly statusLegend: ApexLegend = { position: 'bottom' };

  readonly statusSeries = computed<ApexNonAxisChartSeries>(() => {
    const matchesByStatus = this.summary()?.matchesByStatus;
    if (!matchesByStatus) {
      return [0, 0, 0, 0, 0];
    }

    return [
      matchesByStatus.scheduled,
      matchesByStatus.live,
      matchesByStatus.finished,
      matchesByStatus.postponed,
      matchesByStatus.cancelled,
    ];
  });

  ngOnInit(): void {
    this.loadSummary();
    this.loadRankings();
    this.subscribeToRealtime();
  }

  onRankingsPageChange(event: PageEvent): void {
    this.rankingsPage.set(event.pageIndex + 1);
    this.rankingsLimit.set(event.pageSize);
    this.loadRankings();
  }

  private loadSummary(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.dashboardService
      .getSummary()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: (err: unknown) => {
          this.errorMessage.set(resolveErrorMessage(err, 'No se pudo cargar el resumen.'));
        },
      });
  }

  private loadRankings(): void {
    this.rankingsLoading.set(true);
    this.rankingsError.set(null);

    this.dashboardService
      .getRankings({ page: this.rankingsPage(), limit: this.rankingsLimit() })
      .pipe(finalize(() => this.rankingsLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.rankings.set(res.data);
          this.rankingsTotal.set(res.meta.total);
        },
        error: (err: unknown) => {
          this.rankingsError.set(resolveErrorMessage(err, 'No se pudo cargar el ranking.'));
        },
      });
  }

  private subscribeToRealtime(): void {
    this.realtimeService
      .onPredictionUpdated()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.pushActivity(
          'prediction',
          `Predicciones actualizadas para el partido ${event.matchId}`,
        );
      });

    this.realtimeService
      .onSimulationProgress()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.pushActivity('simulation', `Simulación completada (${event.progress}%)`);
      });
  }

  private pushActivity(type: ActivityEntry['type'], message: string): void {
    const entry: ActivityEntry = {
      id: this.activityCounter++,
      type,
      message,
      timestamp: Date.now(),
    };
    this.activity.update((entries) => [entry, ...entries].slice(0, ACTIVITY_LIMIT));
  }
}
