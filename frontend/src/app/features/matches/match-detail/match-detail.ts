import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize, forkJoin } from 'rxjs';
import { Match, Prediction, PredictionModel } from '../../../core/models';
import { MatchesService } from '../../../core/services/matches.service';
import { PredictionsService } from '../../../core/services/predictions.service';
import { resolveErrorMessage } from '../../../core/utils/http-error.util';

const MODEL_ORDER: PredictionModel[] = [
  PredictionModel.ELO,
  PredictionModel.POISSON,
  PredictionModel.ENSEMBLE,
  PredictionModel.MONTE_CARLO,
];

const MODEL_LABELS: Record<PredictionModel, string> = {
  [PredictionModel.ELO]: 'Elo',
  [PredictionModel.POISSON]: 'Poisson',
  [PredictionModel.MONTE_CARLO]: 'Monte Carlo',
  [PredictionModel.ENSEMBLE]: 'Ensemble',
};

@Component({
  selector: 'app-match-detail',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './match-detail.html',
  styleUrl: './match-detail.scss',
})
export class MatchDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly matchesService = inject(MatchesService);
  private readonly predictionsService = inject(PredictionsService);

  private matchId = '';

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly match = signal<Match | null>(null);
  readonly predictions = signal<Prediction[]>([]);

  readonly generating = signal(false);
  readonly generateError = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.matchId = id;

    forkJoin({
      match: this.matchesService.findOne(id),
      predictions: this.predictionsService.getMatchPredictions(id),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ match, predictions }) => {
          this.match.set(match);
          this.predictions.set(this.sortPredictions(predictions));
        },
        error: (err: unknown) => {
          this.errorMessage.set(resolveErrorMessage(err, 'No se pudo cargar el partido.'));
        },
      });
  }

  generatePrediction(): void {
    this.generating.set(true);
    this.generateError.set(null);

    this.predictionsService
      .generate(this.matchId)
      .pipe(finalize(() => this.generating.set(false)))
      .subscribe({
        next: (predictions) => {
          this.predictions.set(this.sortPredictions(predictions));
        },
        error: (err: unknown) => {
          this.generateError.set(
            resolveErrorMessage(err, 'No se pudo generar la predicción.'),
          );
        },
      });
  }

  modelLabel(model: PredictionModel): string {
    return MODEL_LABELS[model];
  }

  private sortPredictions(predictions: Prediction[]): Prediction[] {
    return [...predictions].sort(
      (a, b) => MODEL_ORDER.indexOf(a.model) - MODEL_ORDER.indexOf(b.model),
    );
  }
}
