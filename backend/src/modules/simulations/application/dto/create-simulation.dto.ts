import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import {
  DEFAULT_ITERATIONS,
  MAX_ITERATIONS,
  MIN_ITERATIONS,
} from '../tournament-simulator';

export class CreateSimulationDto {
  @ApiProperty()
  @IsUUID()
  competitionId: string;

  @ApiPropertyOptional({
    minimum: MIN_ITERATIONS,
    maximum: MAX_ITERATIONS,
    default: DEFAULT_ITERATIONS,
  })
  @IsOptional()
  @IsInt()
  @Min(MIN_ITERATIONS)
  @Max(MAX_ITERATIONS)
  iterations?: number;
}
