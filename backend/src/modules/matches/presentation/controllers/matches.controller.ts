import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../../common/dto/paginated-response.dto';
import { CreateMatchDto } from '../../application/dto/create-match.dto';
import { MatchResponseDto } from '../../application/dto/match-response.dto';
import { MatchStatisticResponseDto } from '../../application/dto/match-statistic-response.dto';
import { QueryMatchesDto } from '../../application/dto/query-matches.dto';
import { UpdateMatchDto } from '../../application/dto/update-match.dto';
import { UpsertMatchStatisticDto } from '../../application/dto/upsert-match-statistic.dto';
import { MatchesService } from '../../application/services/matches.service';

@ApiTags('matches')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  @ApiOperation({
    summary:
      'Listar partidos (paginado, filtros por competicion/equipo/fecha/estado)',
  })
  findAll(
    @Query() query: QueryMatchesDto,
  ): Promise<PaginatedResponseDto<MatchResponseDto>> {
    return this.matchesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener el detalle de un partido (incluye estadisticas)',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<MatchResponseDto> {
    return this.matchesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo partido' })
  create(@Body() dto: CreateMatchDto): Promise<MatchResponseDto> {
    return this.matchesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un partido existente' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMatchDto,
  ): Promise<MatchResponseDto> {
    return this.matchesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un partido' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.matchesService.remove(id);
  }

  @Put(':id/statistics')
  @ApiOperation({
    summary: 'Crear o actualizar las estadisticas de un equipo en un partido',
  })
  upsertStatistics(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertMatchStatisticDto,
  ): Promise<MatchStatisticResponseDto> {
    return this.matchesService.upsertStatistic(id, dto);
  }
}
