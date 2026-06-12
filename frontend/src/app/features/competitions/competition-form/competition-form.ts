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
import { CompetitionStatus, CompetitionType } from '../../../core/models';
import { CompetitionsService } from '../../../core/services/competitions.service';
import { resolveErrorMessage } from '../../../core/utils/http-error.util';
import { dateRangeValidator } from '../../../core/utils/validators';

@Component({
  selector: 'app-competition-form',
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
  templateUrl: './competition-form.html',
  styleUrl: './competition-form.scss',
})
export class CompetitionForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly competitionsService = inject(CompetitionsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly types = Object.values(CompetitionType);
  readonly statuses = Object.values(CompetitionStatus);

  readonly competitionId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly isEdit = computed(() => this.competitionId() !== null);

  readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      type: this.fb.nonNullable.control<CompetitionType | ''>('', Validators.required),
      season: ['', [Validators.required, Validators.minLength(2)]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      status: this.fb.nonNullable.control<CompetitionStatus>(CompetitionStatus.UPCOMING),
    },
    { validators: [dateRangeValidator('startDate', 'endDate')] },
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.competitionId.set(id);
    this.loading.set(true);

    this.competitionsService
      .findOne(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (competition) => {
          this.form.patchValue({
            name: competition.name,
            type: competition.type,
            season: competition.season,
            startDate: this.toDateInput(competition.startDate),
            endDate: this.toDateInput(competition.endDate),
            status: competition.status,
          });
        },
        error: (err: unknown) => {
          this.errorMessage.set(resolveErrorMessage(err, 'No se pudo cargar la competición.'));
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
      type: raw.type as CompetitionType,
      season: raw.season,
      startDate: raw.startDate,
      endDate: raw.endDate,
      status: raw.status,
    };

    this.saving.set(true);
    this.errorMessage.set(null);

    const id = this.competitionId();
    const request = id
      ? this.competitionsService.update(id, payload)
      : this.competitionsService.create(payload);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => void this.router.navigateByUrl('/competitions'),
      error: (err: unknown) => {
        this.errorMessage.set(resolveErrorMessage(err, 'No se pudo guardar la competición.'));
      },
    });
  }

  private toDateInput(isoDate: string): string {
    return isoDate.substring(0, 10);
  }
}
