import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class TeamFormQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 20,
    default: 5,
    description: 'Cantidad de partidos finalizados recientes a considerar',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 5;
}
