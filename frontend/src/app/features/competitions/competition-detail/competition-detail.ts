import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { finalize, forkJoin } from 'rxjs';
import { Competition, StandingsGroup } from '../../../core/models';
import { CompetitionsService } from '../../../core/services/competitions.service';
import { SimulationsService } from '../../../core/services/simulations.service';
import { resolveErrorMessage } from '../../../core/utils/http-error.util';

const MIN_ITERATIONS = 100;
const MAX_ITERATIONS = 5000;
const DEFAULT_ITERATIONS = 1000;

@Component({
  selector: 'app-competition-detail',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './competition-detail.html',
  styleUrl: './competition-detail.scss',
})
export class CompetitionDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly competitionsService = inject(CompetitionsService);
  private readonly simulationsService = inject(SimulationsService);

  readonly displayedColumns = [
    'position',
    'team',
    'played',
    'won',
    'drawn',
    'lost',
    'goalsFor',
    'goalsAgainst',
    'goalDifference',
    'points',
  ];

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly competition = signal<Competition | null>(null);
  readonly standings = signal<StandingsGroup[]>([]);
  readonly hasGroups = signal(false);

  readonly iterationsControl = new FormControl(DEFAULT_ITERATIONS, {
    nonNullable: true,
    validators: [Validators.required, Validators.min(MIN_ITERATIONS), Validators.max(MAX_ITERATIONS)],
  });
  readonly simulating = signal(false);
  readonly simulationError = signal<string | null>(null);

  private competitionId = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.competitionId = id;

    forkJoin({
      competition: this.competitionsService.findOne(id),
      standings: this.competitionsService.getStandings(id),
      teams: this.competitionsService.getTeams(id),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ competition, standings, teams }) => {
          this.competition.set(competition);
          this.standings.set(standings);
          this.hasGroups.set(teams.some((team) => team.groupName !== null));
        },
        error: (err: unknown) => {
          this.errorMessage.set(resolveErrorMessage(err, 'No se pudo cargar la competición.'));
        },
      });
  }

  runSimulation(): void {
    if (this.iterationsControl.invalid) {
      this.iterationsControl.markAsTouched();
      return;
    }

    this.simulating.set(true);
    this.simulationError.set(null);

    this.simulationsService
      .create({ competitionId: this.competitionId, iterations: this.iterationsControl.value })
      .pipe(finalize(() => this.simulating.set(false)))
      .subscribe({
        next: (simulation) => {
          void this.router.navigate(['/simulations', simulation.id]);
        },
        error: (err: unknown) => {
          this.simulationError.set(resolveErrorMessage(err, 'No se pudo simular el torneo.'));
        },
      });
  }
}
