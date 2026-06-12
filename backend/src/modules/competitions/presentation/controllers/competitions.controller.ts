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
import { CompetitionResponseDto } from '../../application/dto/competition-response.dto';
import { CreateCompetitionDto } from '../../application/dto/create-competition.dto';
import { QueryCompetitionsDto } from '../../application/dto/query-competitions.dto';
import { UpdateCompetitionDto } from '../../application/dto/update-competition.dto';
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
}
