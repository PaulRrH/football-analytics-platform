import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { Competition, MatchStage, MatchStatus, Team } from '../../../core/models';
import { CompetitionsService } from '../../../core/services/competitions.service';
import { MatchesService } from '../../../core/services/matches.service';
import { TeamsService } from '../../../core/services/teams.service';
import { differentFieldsValidator } from '../../../core/utils/validators';
import { resolveErrorMessage } from '../../../core/utils/http-error.util';

const TEAMS_PAGE_SIZE = 100;
const COMPETITIONS_PAGE_SIZE = 100;

@Component({
  selector: 'app-match-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './match-form.html',
  styleUrl: './match-form.scss',
})
export class MatchForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly matchesService = inject(MatchesService);
  private readonly teamsService = inject(TeamsService);
  private readonly competitionsService = inject(CompetitionsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly stages = Object.values(MatchStage);
  readonly statuses = Object.values(MatchStatus);
  readonly teams = signal<Team[]>([]);
  readonly competitions = signal<Competition[]>([]);

  readonly matchId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly isEdit = computed(() => this.matchId() !== null);

  readonly form = this.fb.nonNullable.group(
    {
      competitionId: ['', [Validators.required]],
      homeTeamId: ['', [Validators.required]],
      awayTeamId: ['', [Validators.required]],
      matchDate: ['', [Validators.required]],
      venue: [''],
      city: [''],
      stage: this.fb.nonNullable.control<MatchStage | ''>('', Validators.required),
      round: [''],
      homeGoals: this.fb.control<number | null>(null, [Validators.min(0)]),
      awayGoals: this.fb.control<number | null>(null, [Validators.min(0)]),
      status: this.fb.nonNullable.control<MatchStatus>(MatchStatus.SCHEDULED),
    },
    { validators: [differentFieldsValidator('homeTeamId', 'awayTeamId')] },
  );

  ngOnInit(): void {
    this.teamsService.findAll({ limit: TEAMS_PAGE_SIZE }).subscribe({
      next: (res) => this.teams.set(res.data),
      error: (err: unknown) => {
        this.errorMessage.set(resolveErrorMessage(err, 'No se pudieron cargar los equipos.'));
      },
    });

    this.competitionsService.findAll({ limit: COMPETITIONS_PAGE_SIZE }).subscribe({
      next: (res) => this.competitions.set(res.data),
      error: (err: unknown) => {
        this.errorMessage.set(resolveErrorMessage(err, 'No se pudieron cargar las competiciones.'));
      },
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.matchId.set(id);
    this.loading.set(true);

    this.matchesService
      .findOne(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (match) => {
          this.form.patchValue({
            competitionId: match.competitionId,
            homeTeamId: match.homeTeam.id,
            awayTeamId: match.awayTeam.id,
            matchDate: this.toDateTimeLocal(match.matchDate),
            venue: match.venue ?? '',
            city: match.city ?? '',
            stage: match.stage,
            round: match.round ?? '',
            homeGoals: match.homeGoals,
            awayGoals: match.awayGoals,
            status: match.status,
          });
        },
        error: (err: unknown) => {
          this.errorMessage.set(resolveErrorMessage(err, 'No se pudo cargar el partido.'));
        },
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      competitionId: raw.competitionId,
      homeTeamId: raw.homeTeamId,
      awayTeamId: raw.awayTeamId,
      matchDate: new Date(raw.matchDate).toISOString(),
      venue: raw.venue || undefined,
      city: raw.city || undefined,
      stage: raw.stage as MatchStage,
      round: raw.round || undefined,
      homeGoals: raw.homeGoals ?? undefined,
      awayGoals: raw.awayGoals ?? undefined,
      status: raw.status,
    };

    this.saving.set(true);
    this.errorMessage.set(null);

    const id = this.matchId();
    const request = id
      ? this.matchesService.update(id, payload)
      : this.matchesService.create(payload);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => void this.router.navigateByUrl('/matches'),
      error: (err: unknown) => {
        this.errorMessage.set(resolveErrorMessage(err, 'No se pudo guardar el partido.'));
      },
    });
  }

  private toDateTimeLocal(isoDate: string): string {
    const date = new Date(isoDate);
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
