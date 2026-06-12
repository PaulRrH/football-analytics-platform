import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Competition } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PaginatedResponseDto } from '../../../../common/dto/paginated-response.dto';
import {
  type ICompetitionRepository,
  COMPETITION_REPOSITORY,
} from '../../domain/competition-repository.interface';
import { CompetitionResponseDto } from '../dto/competition-response.dto';
import { CreateCompetitionDto } from '../dto/create-competition.dto';
import { QueryCompetitionsDto } from '../dto/query-competitions.dto';
import { UpdateCompetitionDto } from '../dto/update-competition.dto';

@Injectable()
export class CompetitionsService {
  constructor(
    @Inject(COMPETITION_REPOSITORY)
    private readonly competitionRepository: ICompetitionRepository,
  ) {}

  async create(dto: CreateCompetitionDto): Promise<CompetitionResponseDto> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    this.validateDateRange(startDate, endDate);

    const competition = await this.competitionRepository.create({
      ...dto,
      startDate,
      endDate,
    });

    return this.toResponse(competition);
  }

  async findAll(
    query: QueryCompetitionsDto,
  ): Promise<PaginatedResponseDto<CompetitionResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const params = {
      type: query.type,
      status: query.status,
      season: query.season,
      search: query.search,
    };

    const [competitions, total] = await Promise.all([
      this.competitionRepository.findAll({ skip, take: limit, ...params }),
      this.competitionRepository.count(params),
    ]);

    return new PaginatedResponseDto(
      competitions.map((c) => this.toResponse(c)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: string): Promise<CompetitionResponseDto> {
    const competition = await this.findCompetitionOrThrow(id);
    return this.toResponse(competition);
  }

  async update(
    id: string,
    dto: UpdateCompetitionDto,
  ): Promise<CompetitionResponseDto> {
    const existing = await this.findCompetitionOrThrow(id);

    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : existing.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;
    this.validateDateRange(startDate, endDate);

    const updated = await this.competitionRepository.update(id, {
      ...dto,
      startDate: dto.startDate ? startDate : undefined,
      endDate: dto.endDate ? endDate : undefined,
    });

    return this.toResponse(updated);
  }

  async remove(id: string): Promise<void> {
    await this.findCompetitionOrThrow(id);
    await this.competitionRepository.delete(id);
  }

  private validateDateRange(startDate: Date, endDate: Date): void {
    if (startDate >= endDate) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha de fin',
      );
    }
  }

  private async findCompetitionOrThrow(id: string): Promise<Competition> {
    const competition = await this.competitionRepository.findById(id);
    if (!competition) {
      throw new NotFoundException(`Competicion ${id} no encontrada`);
    }
    return competition;
  }

  private toResponse(competition: Competition): CompetitionResponseDto {
    return plainToInstance(CompetitionResponseDto, competition, {
      excludeExtraneousValues: true,
    });
  }
}
