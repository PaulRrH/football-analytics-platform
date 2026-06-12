import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import { Match, MatchStatus } from '../../../core/models';
import { MatchesService } from '../../../core/services/matches.service';
import { resolveErrorMessage } from '../../../core/utils/http-error.util';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-match-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './match-list.html',
  styleUrl: './match-list.scss',
})
export class MatchList implements OnInit {
  private readonly matchesService = inject(MatchesService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly statuses = Object.values(MatchStatus);
  readonly displayedColumns = ['matchDate', 'teams', 'score', 'stage', 'status', 'actions'];

  readonly matches = signal<Match[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly statusControl = new FormControl<MatchStatus | ''>('', { nonNullable: true });
  readonly dateFromControl = new FormControl('', { nonNullable: true });
  readonly dateToControl = new FormControl('', { nonNullable: true });

  ngOnInit(): void {
    this.loadMatches();

    this.statusControl.valueChanges.subscribe(() => {
      this.page.set(1);
      this.loadMatches();
    });

    this.dateFromControl.valueChanges.subscribe(() => {
      this.page.set(1);
      this.loadMatches();
    });

    this.dateToControl.valueChanges.subscribe(() => {
      this.page.set(1);
      this.loadMatches();
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.loadMatches();
  }

  editMatch(match: Match): void {
    void this.router.navigate(['/matches', match.id, 'edit']);
  }

  confirmDelete(match: Match): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar partido',
      message: `¿Seguro que deseas eliminar ${match.homeTeam.name} vs ${match.awayTeam.name}? Esta acción no se puede deshacer.`,
    };

    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmed: boolean | undefined) => {
        if (confirmed) {
          this.deleteMatch(match);
        }
      });
  }

  private deleteMatch(match: Match): void {
    this.matchesService.remove(match.id).subscribe({
      next: () => this.loadMatches(),
      error: (err: unknown) => {
        this.errorMessage.set(resolveErrorMessage(err, 'No se pudo eliminar el partido.'));
      },
    });
  }

  private loadMatches(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.matchesService
      .findAll({
        page: this.page(),
        limit: this.limit(),
        status: this.statusControl.value || undefined,
        dateFrom: this.dateFromControl.value || undefined,
        dateTo: this.dateToControl.value || undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.matches.set(res.data);
          this.total.set(res.meta.total);
        },
        error: (err: unknown) => {
          this.errorMessage.set(resolveErrorMessage(err, 'No se pudieron cargar los partidos.'));
        },
      });
  }
}
