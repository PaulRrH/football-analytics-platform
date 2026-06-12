import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { Competition, ProviderStatus, SyncResult } from '../../../../core/models';
import { CompetitionsService } from '../../../../core/services/competitions.service';
import { SyncService } from '../../../../core/services/sync.service';
import { resolveErrorMessage } from '../../../../core/utils/http-error.util';

const COMPETITIONS_PAGE_SIZE = 100;

@Component({
  selector: 'app-sync-panel',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './sync-panel.html',
  styleUrl: './sync-panel.scss',
})
export class SyncPanel implements OnInit {
  private readonly syncService = inject(SyncService);
  private readonly competitionsService = inject(CompetitionsService);
  private readonly snackBar = inject(MatSnackBar);

  readonly status = signal<ProviderStatus | null>(null);
  readonly competitions = signal<Competition[]>([]);
  readonly selectedCompetitionId = signal('');

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly syncingCompetitions = signal(false);
  readonly syncingTeams = signal(false);
  readonly syncingMatches = signal(false);

  ngOnInit(): void {
    this.syncService
      .getStatus()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (status) => this.status.set(status),
        error: (err: unknown) => {
          this.errorMessage.set(
            resolveErrorMessage(err, 'No se pudo consultar el proveedor de datos externos.'),
          );
        },
      });

    this.competitionsService.findAll({ limit: COMPETITIONS_PAGE_SIZE }).subscribe({
      next: (res) => this.competitions.set(res.data),
      error: (err: unknown) => {
        this.errorMessage.set(
          resolveErrorMessage(err, 'No se pudieron cargar las competiciones.'),
        );
      },
    });
  }

  syncCompetitions(): void {
    this.syncingCompetitions.set(true);
    this.syncService
      .syncCompetitions()
      .pipe(finalize(() => this.syncingCompetitions.set(false)))
      .subscribe({
        next: (result) => this.showResult('Competiciones', result),
        error: (err: unknown) =>
          this.showError(err, 'No se pudieron sincronizar las competiciones.'),
      });
  }

  syncTeams(): void {
    const competitionId = this.selectedCompetitionId();
    if (!competitionId) {
      return;
    }

    this.syncingTeams.set(true);
    this.syncService
      .syncTeams(competitionId)
      .pipe(finalize(() => this.syncingTeams.set(false)))
      .subscribe({
        next: (result) => this.showResult('Equipos', result),
        error: (err: unknown) => this.showError(err, 'No se pudieron sincronizar los equipos.'),
      });
  }

  syncMatches(): void {
    const competitionId = this.selectedCompetitionId();
    if (!competitionId) {
      return;
    }

    this.syncingMatches.set(true);
    this.syncService
      .syncMatches(competitionId)
      .pipe(finalize(() => this.syncingMatches.set(false)))
      .subscribe({
        next: (result) => this.showResult('Partidos', result),
        error: (err: unknown) => this.showError(err, 'No se pudieron sincronizar los partidos.'),
      });
  }

  private showResult(label: string, result: SyncResult): void {
    this.snackBar.open(
      `${label}: ${result.created} creados, ${result.updated} actualizados, ${result.skipped} omitidos.`,
      'Cerrar',
      { duration: 5000 },
    );
  }

  private showError(err: unknown, fallback: string): void {
    this.snackBar.open(resolveErrorMessage(err, fallback), 'Cerrar', { duration: 5000 });
  }
}
