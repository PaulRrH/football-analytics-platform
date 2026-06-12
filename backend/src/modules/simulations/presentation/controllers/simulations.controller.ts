import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateSimulationDto } from '../../application/dto/create-simulation.dto';
import { SimulationResponseDto } from '../../application/dto/simulation-response.dto';
import { SimulationResultsResponseDto } from '../../application/dto/simulation-results-response.dto';
import { TeamSimulationResultDto } from '../../application/dto/team-simulation-result.dto';
import { SimulationsService } from '../../application/services/simulations.service';

@ApiTags('simulations')
@Controller('simulations')
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @Post()
  @ApiOperation({
    summary:
      'Ejecutar una simulacion Monte Carlo del torneo de una competicion',
  })
  create(
    @Body() dto: CreateSimulationDto,
  ): Promise<SimulationResultsResponseDto> {
    return this.simulationsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el estado de una simulacion' })
  getSimulation(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SimulationResponseDto> {
    return this.simulationsService.getSimulation(id);
  }

  @Get(':id/results')
  @ApiOperation({ summary: 'Obtener los resultados de una simulacion' })
  getResults(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SimulationResultsResponseDto> {
    return this.simulationsService.getResults(id);
  }

  @Get(':id/results/teams/:teamId')
  @ApiOperation({
    summary: 'Obtener el resultado de un equipo en una simulacion',
  })
  getTeamResult(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('teamId', ParseUUIDPipe) teamId: string,
  ): Promise<TeamSimulationResultDto> {
    return this.simulationsService.getTeamResult(id, teamId);
  }
}
