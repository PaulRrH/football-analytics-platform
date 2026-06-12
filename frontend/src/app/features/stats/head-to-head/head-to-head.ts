import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';
import { HeadToHead as HeadToHeadResult, Team } from '../../../core/models';
import { StatsService } from '../../../core/services/stats.service';
import { TeamsService } from '../../../core/services/teams.service';
import { resolveErrorMessage } from '../../../core/utils/http-error.util';

const TEAMS_PAGE_SIZE = 100;

@Component({
  selector: 'app-head-to-head',
  imports: [
    DatePipe,
    MatCardModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
  ],
  templateUrl: './head-to-head.html',
  styleUrl: './head-to-head.scss',
})
export class HeadToHead implements OnInit {
  private readonly teamsService = inject(TeamsService);
  private readonly statsService = inject(StatsService);

  readonly teams = signal<Team[]>([]);
  readonly teamAId = signal<string | null>(null);
  readonly teamBId = signal<string | null>(null);
  readonly result = signal<HeadToHeadResult | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly displayedColumns = ['date', 'competition', 'result'];

  ngOnInit(): void {
    this.teamsService.findAll({ limit: TEAMS_PAGE_SIZE }).subscribe({
      next: (res) => this.teams.set(res.data),
      error: (err: unknown) => {
        this.errorMessage.set(resolveErrorMessage(err, 'No se pudieron cargar los equipos.'));
      },
    });
  }

  onTeamAChange(teamId: string): void {
    this.teamAId.set(teamId);
    this.compare();
  }

  onTeamBChange(teamId: string): void {
    this.teamBId.set(teamId);
    this.compare();
  }

  private compare(): void {
    const teamAId = this.teamAId();
    const teamBId = this.teamBId();
    this.result.set(null);

    if (!teamAId || !teamBId) {
      this.errorMessage.set(null);
      return;
    }

    if (teamAId === teamBId) {
      this.errorMessage.set('Selecciona dos equipos distintos.');
      return;
    }

    this.errorMessage.set(null);
    this.loading.set(true);

    this.statsService
      .getHeadToHead(teamAId, teamBId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => this.result.set(result),
        error: (err: unknown) => {
          this.errorMessage.set(resolveErrorMessage(err, 'No se pudo cargar el historial.'));
        },
      });
  }
}
