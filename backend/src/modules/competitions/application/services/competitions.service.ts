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
  type StandingsTeamInfo,
  COMPETITION_REPOSITORY,
} from '../../domain/competition-repository.interface';
import { CompetitionResponseDto } from '../dto/competition-response.dto';
import { CreateCompetitionDto } from '../dto/create-competition.dto';
import { QueryCompetitionsDto } from '../dto/query-competitions.dto';
import { StandingsGroupDto } from '../dto/standings-group.dto';
import { StandingsRowDto } from '../dto/standings-row.dto';
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

  async getStandings(id: string): Promise<StandingsGroupDto[]> {
    await this.findCompetitionOrThrow(id);

    const [teams, matches] = await Promise.all([
      this.competitionRepository.findTeams(id),
      this.competitionRepository.findFinishedMatches(id),
    ]);

    const rowsByTeamId = new Map<string, StandingsRowDto>();
    const groupByTeamId = new Map<string, string | null>();
    const groupOrder: (string | null)[] = [];

    const registerTeam = (
      teamId: string,
      team: StandingsTeamInfo,
      groupName: string | null,
    ): void => {
      if (rowsByTeamId.has(teamId)) {
        return;
      }

      rowsByTeamId.set(teamId, {
        team: {
          id: team.id,
          name: team.name,
          shortName: team.shortName,
          logoUrl: team.logoUrl,
        },
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      });
      groupByTeamId.set(teamId, groupName);

      if (!groupOrder.includes(groupName)) {
        groupOrder.push(groupName);
      }
    };

    if (teams.length > 0) {
      for (const entry of teams) {
        registerTeam(entry.teamId, entry.team, entry.groupName);
      }
    } else {
      for (const match of matches) {
        registerTeam(match.homeTeamId, match.homeTeam, null);
        registerTeam(match.awayTeamId, match.awayTeam, null);
      }
    }

    for (const match of matches) {
      const homeRow = rowsByTeamId.get(match.homeTeamId);
      const awayRow = rowsByTeamId.get(match.awayTeamId);

      if (!homeRow || !awayRow) {
        continue;
      }

      if (
        groupByTeamId.get(match.homeTeamId) !==
        groupByTeamId.get(match.awayTeamId)
      ) {
        continue;
      }

      this.applyMatchResult(homeRow, awayRow, match.homeGoals, match.awayGoals);
    }

    return groupOrder.map((groupName) => ({
      groupName,
      standings: this.sortStandings(
        [...rowsByTeamId.entries()]
          .filter(([teamId]) => groupByTeamId.get(teamId) === groupName)
          .map(([, row]) => row),
      ),
    }));
  }

  private applyMatchResult(
    home: StandingsRowDto,
    away: StandingsRowDto,
    homeGoals: number,
    awayGoals: number,
  ): void {
    home.played += 1;
    away.played += 1;
    home.goalsFor += homeGoals;
    home.goalsAgainst += awayGoals;
    away.goalsFor += awayGoals;
    away.goalsAgainst += homeGoals;
    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;

    if (homeGoals > awayGoals) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (homeGoals < awayGoals) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      home.points += 1;
      away.drawn += 1;
      away.points += 1;
    }
  }

  private sortStandings(rows: StandingsRowDto[]): StandingsRowDto[] {
    return [...rows].sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.team.name.localeCompare(b.team.name),
    );
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
