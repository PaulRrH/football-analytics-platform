import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { finalize, forkJoin } from 'rxjs';
import { Competition, StandingsGroup } from '../../../core/models';
import { CompetitionsService } from '../../../core/services/competitions.service';
import { resolveErrorMessage } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-competition-detail',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './competition-detail.html',
  styleUrl: './competition-detail.scss',
})
export class CompetitionDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly competitionsService = inject(CompetitionsService);

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

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    forkJoin({
      competition: this.competitionsService.findOne(id),
      standings: this.competitionsService.getStandings(id),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ competition, standings }) => {
          this.competition.set(competition);
          this.standings.set(standings);
        },
        error: (err: unknown) => {
          this.errorMessage.set(resolveErrorMessage(err, 'No se pudo cargar la competición.'));
        },
      });
  }
}
