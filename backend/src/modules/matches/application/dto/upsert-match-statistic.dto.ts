import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class UpsertMatchStatisticDto {
  @ApiProperty({
    description: 'ID del equipo (debe ser local o visitante del partido)',
  })
  @IsUUID()
  teamId: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, example: 58.4 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  possession?: number;

  @ApiPropertyOptional({ minimum: 0, example: 12 })
  @IsOptional()
  @IsInt()
  @Min(0)
  shotsTotal?: number;

  @ApiPropertyOptional({ minimum: 0, example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  shotsOnTarget?: number;

  @ApiPropertyOptional({ minimum: 0, example: 6 })
  @IsOptional()
  @IsInt()
  @Min(0)
  corners?: number;

  @ApiPropertyOptional({ minimum: 0, example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  fouls?: number;

  @ApiPropertyOptional({ minimum: 0, example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  yellowCards?: number;

  @ApiPropertyOptional({ minimum: 0, example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  redCards?: number;

  @ApiPropertyOptional({ minimum: 0, example: 480 })
  @IsOptional()
  @IsInt()
  @Min(0)
  passes?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, example: 87.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  passAccuracy?: number;

  @ApiPropertyOptional({ minimum: 0, example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  offsides?: number;
}
