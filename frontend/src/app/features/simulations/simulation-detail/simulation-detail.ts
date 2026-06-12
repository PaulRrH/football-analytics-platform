import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { SimulationResults } from '../../../core/models';
import { SimulationsService } from '../../../core/services/simulations.service';
import { resolveErrorMessage } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-simulation-detail',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './simulation-detail.html',
  styleUrl: './simulation-detail.scss',
})
export class SimulationDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly simulationsService = inject(SimulationsService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly simulation = signal<SimulationResults | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.simulationsService
      .getResults(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (simulation) => {
          this.simulation.set(simulation);
        },
        error: (err: unknown) => {
          this.errorMessage.set(resolveErrorMessage(err, 'No se pudo cargar la simulación.'));
        },
      });
  }
}
