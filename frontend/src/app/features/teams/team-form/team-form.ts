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
import { Confederation } from '../../../core/models';
import { TeamsService } from '../../../core/services/teams.service';
import { resolveErrorMessage } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-team-form',
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
  templateUrl: './team-form.html',
  styleUrl: './team-form.scss',
})
export class TeamForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly teamsService = inject(TeamsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly confederations = Object.values(Confederation);

  readonly teamId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly isEdit = computed(() => this.teamId() !== null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    shortName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
    country: ['', [Validators.required, Validators.minLength(2)]],
    confederation: this.fb.nonNullable.control<Confederation | ''>('', Validators.required),
    logoUrl: [''],
    fifaRanking: this.fb.control<number | null>(null, [Validators.min(1)]),
    fifaRankingPoints: this.fb.control<number | null>(null),
    eloRating: [1500, [Validators.required, Validators.min(0), Validators.max(4000)]],
    foundedYear: this.fb.control<number | null>(null, [Validators.min(1800)]),
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.teamId.set(id);
    this.loading.set(true);

    this.teamsService
      .findOne(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (team) => {
          this.form.patchValue({
            name: team.name,
            shortName: team.shortName,
            country: team.country,
            confederation: team.confederation,
            logoUrl: team.logoUrl ?? '',
            fifaRanking: team.fifaRanking,
            fifaRankingPoints: team.fifaRankingPoints,
            eloRating: team.eloRating,
            foundedYear: team.foundedYear,
          });
        },
        error: (err: unknown) => {
          this.errorMessage.set(resolveErrorMessage(err, 'No se pudo cargar el equipo.'));
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
      name: raw.name,
      shortName: raw.shortName.toUpperCase(),
      country: raw.country,
      confederation: raw.confederation as Confederation,
      logoUrl: raw.logoUrl || undefined,
      fifaRanking: raw.fifaRanking ?? undefined,
      fifaRankingPoints: raw.fifaRankingPoints ?? undefined,
      eloRating: raw.eloRating,
      foundedYear: raw.foundedYear ?? undefined,
    };

    this.saving.set(true);
    this.errorMessage.set(null);

    const id = this.teamId();
    const request = id ? this.teamsService.update(id, payload) : this.teamsService.create(payload);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (team) => void this.router.navigate(['/teams', team.id]),
      error: (err: unknown) => {
        this.errorMessage.set(resolveErrorMessage(err, 'No se pudo guardar el equipo.'));
      },
    });
  }
}
