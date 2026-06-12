import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { SimulationResponseDto } from './simulation-response.dto';
import { TeamSimulationResultDto } from './team-simulation-result.dto';

export class SimulationResultsResponseDto extends SimulationResponseDto {
  @Expose()
  @Type(() => TeamSimulationResultDto)
  @ApiProperty({ type: TeamSimulationResultDto, isArray: true })
  teamResults: TeamSimulationResultDto[];
}
