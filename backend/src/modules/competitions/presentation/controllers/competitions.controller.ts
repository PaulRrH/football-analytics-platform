import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../../common/dto/paginated-response.dto';
import { CompetitionResponseDto } from '../../application/dto/competition-response.dto';
import { CompetitionTeamResponseDto } from '../../application/dto/competition-team-response.dto';
import { CreateCompetitionDto } from '../../application/dto/create-competition.dto';
import { QueryCompetitionsDto } from '../../application/dto/query-competitions.dto';
import { StandingsGroupDto } from '../../application/dto/standings-group.dto';
import { UpdateCompetitionDto } from '../../application/dto/update-competition.dto';
import { UpsertCompetitionTeamDto } from '../../application/dto/upsert-competition-team.dto';
import { CompetitionsService } from '../../application/services/competitions.service';

@ApiTags('competitions')
@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Get()
  @ApiOperation({
    summary:
      'Listar competiciones (paginado, filtros por tipo/estado/temporada/busqueda)',
  })
  findAll(
    @Query() query: QueryCompetitionsDto,
  ): Promise<PaginatedResponseDto<CompetitionResponseDto>> {
    return this.competitionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de una competicion' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CompetitionResponseDto> {
    return this.competitionsService.findOne(id);
  }

  @Get(':id/standings')
  @ApiOperation({
    summary: 'Obtener la tabla de posiciones de una competicion',
  })
  getStandings(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StandingsGroupDto[]> {
    return this.competitionsService.getStandings(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva competicion' })
  create(@Body() dto: CreateCompetitionDto): Promise<CompetitionResponseDto> {
    return this.competitionsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una competicion existente' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompetitionDto,
  ): Promise<CompetitionResponseDto> {
    return this.competitionsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una competicion' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.competitionsService.remove(id);
  }

  @Get(':id/teams')
  @ApiOperation({
    summary: 'Listar los equipos de una competicion (grupo y seed)',
  })
  findTeams(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CompetitionTeamResponseDto[]> {
    return this.competitionsService.findCompetitionTeams(id);
  }

  @Put(':id/teams/:teamId')
  @ApiOperation({
    summary: 'Asignar un equipo a la competicion (grupo y/o seed)',
  })
  upsertTeam(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() dto: UpsertCompetitionTeamDto,
  ): Promise<CompetitionTeamResponseDto> {
    return this.competitionsService.upsertTeam(id, teamId, dto);
  }

  @Delete(':id/teams/:teamId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Quitar un equipo de la competicion' })
  removeTeam(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('teamId', ParseUUIDPipe) teamId: string,
  ): Promise<void> {
    return this.competitionsService.removeTeam(id, teamId);
  }
}
