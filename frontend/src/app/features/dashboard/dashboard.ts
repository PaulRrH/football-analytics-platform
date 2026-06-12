import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexPlotOptions,
  ApexXAxis,
  ChartComponent,
} from 'ng-apexcharts';
import { finalize } from 'rxjs';
import { Team } from '../../core/models';
import { TeamsService } from '../../core/services/teams.service';
import { resolveErrorMessage } from '../../core/utils/http-error.util';

const TOP_TEAMS_COUNT = 10;

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatProgressSpinnerModule, ChartComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly teamsService = inject(TeamsService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly topTeams = signal<Team[]>([]);

  readonly chart: ApexChart = { type: 'bar', height: 420 };
  readonly plotOptions: ApexPlotOptions = {
    bar: { horizontal: true, borderRadius: 4, distributed: true },
  };
  readonly dataLabels: ApexDataLabels = { enabled: true };

  readonly chartSeries = computed<ApexAxisChartSeries>(() => [
    {
      name: 'Elo Rating',
      data: this.topTeams().map((team) => team.eloRating),
    },
  ]);

  readonly xaxis = computed<ApexXAxis>(() => ({
    categories: this.topTeams().map((team) => team.name),
  }));

  ngOnInit(): void {
    this.teamsService
      .findAll({ limit: 50 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          const ranked = [...res.data]
            .sort((a, b) => b.eloRating - a.eloRating)
            .slice(0, TOP_TEAMS_COUNT);
          this.topTeams.set(ranked);
        },
        error: (err: unknown) => {
          this.errorMessage.set(
            resolveErrorMessage(err, 'No se pudo cargar el ranking de equipos.'),
          );
        },
      });
  }
}
