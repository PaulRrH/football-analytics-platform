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
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { Competition, CompetitionStatus, CompetitionType } from '../../../core/models';
import { CompetitionsService } from '../../../core/services/competitions.service';
import { resolveErrorMessage } from '../../../core/utils/http-error.util';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-competition-list',
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
  templateUrl: './competition-list.html',
  styleUrl: './competition-list.scss',
})
export class CompetitionList implements OnInit {
  private readonly competitionsService = inject(CompetitionsService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly types = Object.values(CompetitionType);
  readonly statuses = Object.values(CompetitionStatus);
  readonly displayedColumns = ['name', 'type', 'season', 'dates', 'status', 'actions'];

  readonly competitions = signal<Competition[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly typeControl = new FormControl<CompetitionType | ''>('', { nonNullable: true });
  readonly statusControl = new FormControl<CompetitionStatus | ''>('', { nonNullable: true });

  ngOnInit(): void {
    this.loadCompetitions();

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.page.set(1);
        this.loadCompetitions();
      });

    this.typeControl.valueChanges.subscribe(() => {
      this.page.set(1);
      this.loadCompetitions();
    });

    this.statusControl.valueChanges.subscribe(() => {
      this.page.set(1);
      this.loadCompetitions();
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.loadCompetitions();
  }

  editCompetition(competition: Competition, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/competitions', competition.id, 'edit']);
  }

  confirmDelete(competition: Competition, event: Event): void {
    event.stopPropagation();

    const data: ConfirmDialogData = {
      title: 'Eliminar competición',
      message: `¿Seguro que deseas eliminar "${competition.name}"? Esta acción no se puede deshacer.`,
    };

    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmed: boolean | undefined) => {
        if (confirmed) {
          this.deleteCompetition(competition);
        }
      });
  }

  private deleteCompetition(competition: Competition): void {
    this.competitionsService.remove(competition.id).subscribe({
      next: () => this.loadCompetitions(),
      error: (err: unknown) => {
        this.errorMessage.set(resolveErrorMessage(err, 'No se pudo eliminar la competición.'));
      },
    });
  }

  private loadCompetitions(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.competitionsService
      .findAll({
        page: this.page(),
        limit: this.limit(),
        search: this.searchControl.value || undefined,
        type: this.typeControl.value || undefined,
        status: this.statusControl.value || undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.competitions.set(res.data);
          this.total.set(res.meta.total);
        },
        error: (err: unknown) => {
          this.errorMessage.set(resolveErrorMessage(err, 'No se pudieron cargar las competiciones.'));
        },
      });
  }
}
