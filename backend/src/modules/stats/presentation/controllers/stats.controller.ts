import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HeadToHeadQueryDto } from '../../application/dto/head-to-head-query.dto';
import { HeadToHeadResponseDto } from '../../application/dto/head-to-head-response.dto';
import { TeamFormQueryDto } from '../../application/dto/team-form-query.dto';
import { TeamFormResponseDto } from '../../application/dto/team-form-response.dto';
import { StatsService } from '../../application/services/stats.service';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('teams/:id')
  @ApiOperation({ summary: 'Obtener la forma reciente de un equipo' })
  getTeamForm(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: TeamFormQueryDto,
  ): Promise<TeamFormResponseDto> {
    return this.statsService.getTeamForm(id, query.limit ?? 5);
  }

  @Get('head-to-head')
  @ApiOperation({
    summary:
      'Obtener el historial de enfrentamientos directos entre dos equipos',
  })
  getHeadToHead(
    @Query() query: HeadToHeadQueryDto,
  ): Promise<HeadToHeadResponseDto> {
    return this.statsService.getHeadToHead(query.teamA, query.teamB);
  }
}
