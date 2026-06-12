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
import { Confederation, Team } from '../../../core/models';
import { TeamsService } from '../../../core/services/teams.service';
import { resolveErrorMessage } from '../../../core/utils/http-error.util';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-team-list',
  imports: [
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
  templateUrl: './team-list.html',
  styleUrl: './team-list.scss',
})
export class TeamList implements OnInit {
  private readonly teamsService = inject(TeamsService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly confederations = Object.values(Confederation);
  readonly displayedColumns = [
    'name',
    'country',
    'confederation',
    'fifaRanking',
    'eloRating',
    'actions',
  ];

  readonly teams = signal<Team[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly confederationControl = new FormControl<Confederation | ''>('', { nonNullable: true });

  ngOnInit(): void {
    this.loadTeams();

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.page.set(1);
        this.loadTeams();
      });

    this.confederationControl.valueChanges.subscribe(() => {
      this.page.set(1);
      this.loadTeams();
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.loadTeams();
  }

  openDetail(team: Team): void {
    void this.router.navigate(['/teams', team.id]);
  }

  editTeam(team: Team, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/teams', team.id, 'edit']);
  }

  confirmDelete(team: Team, event: Event): void {
    event.stopPropagation();

    const data: ConfirmDialogData = {
      title: 'Eliminar equipo',
      message: `¿Seguro que deseas eliminar a ${team.name}? Esta acción no se puede deshacer.`,
    };

    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmed: boolean | undefined) => {
        if (confirmed) {
          this.deleteTeam(team);
        }
      });
  }

  private deleteTeam(team: Team): void {
    this.teamsService.remove(team.id).subscribe({
      next: () => this.loadTeams(),
      error: (err: unknown) => {
        this.errorMessage.set(resolveErrorMessage(err, 'No se pudo eliminar el equipo.'));
      },
    });
  }

  private loadTeams(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.teamsService
      .findAll({
        page: this.page(),
        limit: this.limit(),
        search: this.searchControl.value || undefined,
        confederation: this.confederationControl.value || undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.teams.set(res.data);
          this.total.set(res.meta.total);
        },
        error: (err: unknown) => {
          this.errorMessage.set(resolveErrorMessage(err, 'No se pudieron cargar los equipos.'));
        },
      });
  }
}
