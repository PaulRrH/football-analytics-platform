import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../../common/dto/paginated-response.dto';
import { CreateTeamDto } from '../../application/dto/create-team.dto';
import { QueryTeamsDto } from '../../application/dto/query-teams.dto';
import { RankingHistoryResponseDto } from '../../application/dto/ranking-history-response.dto';
import { TeamResponseDto } from '../../application/dto/team-response.dto';
import { UpdateTeamDto } from '../../application/dto/update-team.dto';
import { TeamsService } from '../../application/services/teams.service';

@ApiTags('teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar equipos (paginado, filtros por confederacion/busqueda)',
  })
  findAll(
    @Query() query: QueryTeamsDto,
  ): Promise<PaginatedResponseDto<TeamResponseDto>> {
    return this.teamsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de un equipo' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TeamResponseDto> {
    return this.teamsService.findOne(id);
  }

  @Get(':id/ranking-history')
  @ApiOperation({
    summary: 'Obtener el historial de ranking FIFA/Elo de un equipo',
  })
  getRankingHistory(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RankingHistoryResponseDto[]> {
    return this.teamsService.getRankingHistory(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo equipo' })
  create(@Body() dto: CreateTeamDto): Promise<TeamResponseDto> {
    return this.teamsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un equipo existente' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeamDto,
  ): Promise<TeamResponseDto> {
    return this.teamsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un equipo' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.teamsService.remove(id);
  }
}
