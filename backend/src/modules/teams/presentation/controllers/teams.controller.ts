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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../../common/decorators/public.decorator';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { PaginatedResponseDto } from '../../../../common/dto/paginated-response.dto';
import { Role } from '../../../../common/enums/role.enum';
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

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Listar equipos (paginado, filtros por confederacion/busqueda)',
  })
  findAll(
    @Query() query: QueryTeamsDto,
  ): Promise<PaginatedResponseDto<TeamResponseDto>> {
    return this.teamsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de un equipo' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TeamResponseDto> {
    return this.teamsService.findOne(id);
  }

  @Public()
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
  @ApiBearerAuth()
  @Roles(Role.ANALYST, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Crear un nuevo equipo' })
  create(@Body() dto: CreateTeamDto): Promise<TeamResponseDto> {
    return this.teamsService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.ANALYST, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Actualizar un equipo existente' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeamDto,
  ): Promise<TeamResponseDto> {
    return this.teamsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(Role.ANALYST, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Eliminar un equipo' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.teamsService.remove(id);
  }
}
