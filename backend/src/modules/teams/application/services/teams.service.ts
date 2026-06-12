import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Team, TeamRankingHistory } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PaginatedResponseDto } from '../../../../common/dto/paginated-response.dto';
import {
  type ITeamRepository,
  TEAM_REPOSITORY,
} from '../../domain/team-repository.interface';
import { CreateTeamDto } from '../dto/create-team.dto';
import { QueryTeamsDto } from '../dto/query-teams.dto';
import { RankingHistoryResponseDto } from '../dto/ranking-history-response.dto';
import { TeamResponseDto } from '../dto/team-response.dto';
import { UpdateTeamDto } from '../dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @Inject(TEAM_REPOSITORY) private readonly teamRepository: ITeamRepository,
  ) {}

  async create(dto: CreateTeamDto): Promise<TeamResponseDto> {
    const existing = await this.teamRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException(
        `Ya existe un equipo con el nombre "${dto.name}"`,
      );
    }

    const team = await this.teamRepository.create(dto);
    return this.toResponse(team);
  }

  async findAll(
    query: QueryTeamsDto,
  ): Promise<PaginatedResponseDto<TeamResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const params = { confederation: query.confederation, search: query.search };
    const [teams, total] = await Promise.all([
      this.teamRepository.findAll({ skip, take: limit, ...params }),
      this.teamRepository.count(params),
    ]);

    return new PaginatedResponseDto(
      teams.map((t) => this.toResponse(t)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: string): Promise<TeamResponseDto> {
    const team = await this.findTeamOrThrow(id);
    return this.toResponse(team);
  }

  async update(id: string, dto: UpdateTeamDto): Promise<TeamResponseDto> {
    await this.findTeamOrThrow(id);

    if (dto.name) {
      const existing = await this.teamRepository.findByName(dto.name);
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Ya existe un equipo con el nombre "${dto.name}"`,
        );
      }
    }

    const updated = await this.teamRepository.update(id, dto);
    return this.toResponse(updated);
  }

  async remove(id: string): Promise<void> {
    await this.findTeamOrThrow(id);
    await this.teamRepository.delete(id);
  }

  async getRankingHistory(id: string): Promise<RankingHistoryResponseDto[]> {
    await this.findTeamOrThrow(id);
    const history = await this.teamRepository.findRankingHistory(id);
    return history.map((h) => this.toHistoryResponse(h));
  }

  private async findTeamOrThrow(id: string): Promise<Team> {
    const team = await this.teamRepository.findById(id);
    if (!team) {
      throw new NotFoundException(`Equipo ${id} no encontrado`);
    }
    return team;
  }

  private toResponse(team: Team): TeamResponseDto {
    return plainToInstance(TeamResponseDto, team, {
      excludeExtraneousValues: true,
    });
  }

  private toHistoryResponse(
    history: TeamRankingHistory,
  ): RankingHistoryResponseDto {
    return plainToInstance(RankingHistoryResponseDto, history, {
      excludeExtraneousValues: true,
    });
  }
}
