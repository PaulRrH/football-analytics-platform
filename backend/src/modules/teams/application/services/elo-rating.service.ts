import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MatchStage } from '@prisma/client';
import { calculateEloRatingChange } from '../../../../common/utils/elo.util';
import {
  type ITeamRepository,
  TEAM_REPOSITORY,
} from '../../domain/team-repository.interface';

/**
 * Recalcula el `eloRating` de ambos equipos tras un partido finalizado
 * (domain event) y registra el nuevo valor en `TeamRankingHistory`
 * (ver PREDICTION_ENGINE.md §1).
 */
@Injectable()
export class EloRatingService {
  constructor(
    @Inject(TEAM_REPOSITORY)
    private readonly teamRepository: ITeamRepository,
  ) {}

  async applyMatchResult(
    homeTeamId: string,
    awayTeamId: string,
    homeGoals: number,
    awayGoals: number,
    stage: MatchStage,
  ): Promise<void> {
    const [homeTeam, awayTeam] = await Promise.all([
      this.teamRepository.findById(homeTeamId),
      this.teamRepository.findById(awayTeamId),
    ]);

    if (!homeTeam || !awayTeam) {
      throw new NotFoundException('Equipo no encontrado para recalcular Elo');
    }

    const { homeRating, awayRating } = calculateEloRatingChange(
      homeTeam.eloRating,
      awayTeam.eloRating,
      homeGoals,
      awayGoals,
      stage,
    );

    const recordedAt = new Date();

    await Promise.all([
      this.teamRepository.update(homeTeamId, { eloRating: homeRating }),
      this.teamRepository.update(awayTeamId, { eloRating: awayRating }),
      this.teamRepository.recordRankingHistory(homeTeamId, {
        eloRating: homeRating,
        fifaRanking: homeTeam.fifaRanking,
        fifaPoints: homeTeam.fifaRankingPoints,
        recordedAt,
      }),
      this.teamRepository.recordRankingHistory(awayTeamId, {
        eloRating: awayRating,
        fifaRanking: awayTeam.fifaRanking,
        fifaPoints: awayTeam.fifaRankingPoints,
        recordedAt,
      }),
    ]);
  }
}
