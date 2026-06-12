import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PaginatedResponseDto } from '../../../../common/dto/paginated-response.dto';
import {
  type IMatchRepository,
  MATCH_REPOSITORY,
  type MatchListItem,
  type MatchWithRelations,
} from '../../domain/match-repository.interface';
import { CreateMatchDto } from '../dto/create-match.dto';
import { MatchResponseDto } from '../dto/match-response.dto';
import { MatchStatisticResponseDto } from '../dto/match-statistic-response.dto';
import { QueryMatchesDto } from '../dto/query-matches.dto';
import { UpdateMatchDto } from '../dto/update-match.dto';
import { UpsertMatchStatisticDto } from '../dto/upsert-match-statistic.dto';

@Injectable()
export class MatchesService {
  constructor(
    @Inject(MATCH_REPOSITORY)
    private readonly matchRepository: IMatchRepository,
  ) {}

  async create(dto: CreateMatchDto): Promise<MatchResponseDto> {
    if (dto.homeTeamId === dto.awayTeamId) {
      throw new BadRequestException(
        'El equipo local y el visitante no pueden ser el mismo',
      );
    }

    const match = await this.matchRepository.create({
      ...dto,
      matchDate: new Date(dto.matchDate),
    });

    return this.findOne(match.id);
  }

  async findAll(
    query: QueryMatchesDto,
  ): Promise<PaginatedResponseDto<MatchResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const params = {
      competitionId: query.competitionId,
      teamId: query.teamId,
      status: query.status,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    };

    const [matches, total] = await Promise.all([
      this.matchRepository.findAll({ skip, take: limit, ...params }),
      this.matchRepository.count(params),
    ]);

    return new PaginatedResponseDto(
      matches.map((m) => this.toResponse(m)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: string): Promise<MatchResponseDto> {
    const match = await this.findMatchOrThrow(id);
    return this.toResponse(match);
  }

  async update(id: string, dto: UpdateMatchDto): Promise<MatchResponseDto> {
    const existing = await this.findMatchOrThrow(id);

    const homeTeamId = dto.homeTeamId ?? existing.homeTeamId;
    const awayTeamId = dto.awayTeamId ?? existing.awayTeamId;
    if (homeTeamId === awayTeamId) {
      throw new BadRequestException(
        'El equipo local y el visitante no pueden ser el mismo',
      );
    }

    await this.matchRepository.update(id, {
      ...dto,
      matchDate: dto.matchDate ? new Date(dto.matchDate) : undefined,
    });

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findMatchOrThrow(id);
    await this.matchRepository.delete(id);
  }

  async upsertStatistic(
    matchId: string,
    dto: UpsertMatchStatisticDto,
  ): Promise<MatchStatisticResponseDto> {
    const match = await this.findMatchOrThrow(matchId);

    if (dto.teamId !== match.homeTeamId && dto.teamId !== match.awayTeamId) {
      throw new BadRequestException(
        'El equipo indicado no participa en este partido',
      );
    }

    const statistic = await this.matchRepository.upsertStatistic({
      matchId,
      ...dto,
    });
    return plainToInstance(MatchStatisticResponseDto, statistic, {
      excludeExtraneousValues: true,
    });
  }

  private async findMatchOrThrow(id: string): Promise<MatchWithRelations> {
    const match = await this.matchRepository.findById(id);
    if (!match) {
      throw new NotFoundException(`Partido ${id} no encontrado`);
    }
    return match;
  }

  private toResponse(
    match: MatchListItem | MatchWithRelations,
  ): MatchResponseDto {
    return plainToInstance(MatchResponseDto, match, {
      excludeExtraneousValues: true,
    });
  }
}
