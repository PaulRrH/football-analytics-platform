import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Competition, MatchStatus } from '@prisma/client';
import {
  COMPETITION_REPOSITORY,
  type ICompetitionRepository,
} from '../../../competitions/domain/competition-repository.interface';
import { EloRatingService } from '../../../teams/application/services/elo-rating.service';
import {
  TEAM_REPOSITORY,
  type ITeamRepository,
} from '../../../teams/domain/team-repository.interface';
import {
  MATCH_REPOSITORY,
  type IMatchRepository,
} from '../../../matches/domain/match-repository.interface';
import {
  SPORTS_DATA_PROVIDER,
  type SportsDataProvider,
} from '../../domain/sports-data-provider.interface';
import { ProviderStatusResponseDto } from '../dto/provider-status-response.dto';
import { SyncResultResponseDto } from '../dto/sync-result-response.dto';

const NOT_LINKED_MESSAGE =
  'Esta competición no está vinculada a un proveedor externo. Ejecuta antes "Sincronizar competiciones".';

@Injectable()
export class SyncService {
  constructor(
    @Inject(SPORTS_DATA_PROVIDER)
    private readonly provider: SportsDataProvider,
    @Inject(COMPETITION_REPOSITORY)
    private readonly competitionRepository: ICompetitionRepository,
    @Inject(TEAM_REPOSITORY)
    private readonly teamRepository: ITeamRepository,
    @Inject(MATCH_REPOSITORY)
    private readonly matchRepository: IMatchRepository,
    private readonly eloRatingService: EloRatingService,
  ) {}

  getStatus(): ProviderStatusResponseDto {
    return {
      provider: this.provider.getProviderName(),
      configured: this.provider.isConfigured(),
    };
  }

  async syncCompetitions(): Promise<SyncResultResponseDto> {
    const competitions = await this.provider.getCompetitions();

    let created = 0;
    let updated = 0;

    for (const competition of competitions) {
      const existing = await this.competitionRepository.findByExternalId(
        competition.externalId,
      );

      if (existing) {
        await this.competitionRepository.update(existing.id, {
          name: competition.name,
          type: competition.type,
          season: competition.season,
          startDate: competition.startDate,
          endDate: competition.endDate,
        });
        updated++;
      } else {
        await this.competitionRepository.create({
          name: competition.name,
          type: competition.type,
          season: competition.season,
          startDate: competition.startDate,
          endDate: competition.endDate,
          externalId: competition.externalId,
        });
        created++;
      }
    }

    return { created, updated, skipped: 0 };
  }

  async syncTeams(competitionId: string): Promise<SyncResultResponseDto> {
    const competition = await this.findCompetitionOrThrow(competitionId);

    const teams = await this.provider.getTeams(competition.externalId);

    let created = 0;
    let updated = 0;

    for (const team of teams) {
      const existing = await this.teamRepository.findByExternalId(
        team.externalId,
      );

      let teamId: string;
      if (existing) {
        const updatedTeam = await this.teamRepository.update(existing.id, {
          name: team.name,
          shortName: team.shortName,
          country: team.country,
          confederation: team.confederation,
          logoUrl: team.logoUrl,
        });
        teamId = updatedTeam.id;
        updated++;
      } else {
        const createdTeam = await this.teamRepository.create({
          name: team.name,
          shortName: team.shortName,
          country: team.country,
          confederation: team.confederation,
          logoUrl: team.logoUrl,
          externalId: team.externalId,
        });
        teamId = createdTeam.id;
        created++;
      }

      await this.competitionRepository.upsertTeam(competitionId, teamId, {});
    }

    return { created, updated, skipped: 0 };
  }

  async syncMatches(competitionId: string): Promise<SyncResultResponseDto> {
    const competition = await this.findCompetitionOrThrow(competitionId);

    const matches = await this.provider.getMatches(competition.externalId);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const match of matches) {
      const [homeTeam, awayTeam] = await Promise.all([
        this.teamRepository.findByExternalId(match.homeTeamExternalId),
        this.teamRepository.findByExternalId(match.awayTeamExternalId),
      ]);

      if (!homeTeam || !awayTeam) {
        skipped++;
        continue;
      }

      const existing = await this.matchRepository.findByExternalId(
        match.externalId,
      );

      if (!existing) {
        await this.matchRepository.create({
          competitionId,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          matchDate: match.matchDate,
          stage: match.stage,
          round: match.round,
          homeGoals: match.homeGoals,
          awayGoals: match.awayGoals,
          status: match.status,
          externalId: match.externalId,
        });
        created++;
        continue;
      }

      const hasChanges =
        existing.status !== match.status ||
        existing.stage !== match.stage ||
        existing.round !== (match.round ?? null) ||
        existing.homeGoals !== (match.homeGoals ?? null) ||
        existing.awayGoals !== (match.awayGoals ?? null) ||
        existing.matchDate.getTime() !== match.matchDate.getTime();

      if (!hasChanges) {
        skipped++;
        continue;
      }

      await this.matchRepository.update(existing.id, {
        matchDate: match.matchDate,
        stage: match.stage,
        round: match.round,
        homeGoals: match.homeGoals,
        awayGoals: match.awayGoals,
        status: match.status,
      });
      updated++;

      if (
        existing.status !== MatchStatus.FINISHED &&
        match.status === MatchStatus.FINISHED &&
        match.homeGoals != null &&
        match.awayGoals != null
      ) {
        await this.eloRatingService.applyMatchResult(
          homeTeam.id,
          awayTeam.id,
          match.homeGoals,
          match.awayGoals,
          match.stage,
        );
      }
    }

    return { created, updated, skipped };
  }

  private async findCompetitionOrThrow(
    competitionId: string,
  ): Promise<Competition & { externalId: string }> {
    const competition =
      await this.competitionRepository.findById(competitionId);
    if (!competition) {
      throw new NotFoundException(`Competición ${competitionId} no encontrada`);
    }
    if (!competition.externalId) {
      throw new BadRequestException(NOT_LINKED_MESSAGE);
    }
    return competition as Competition & { externalId: string };
  }
}
