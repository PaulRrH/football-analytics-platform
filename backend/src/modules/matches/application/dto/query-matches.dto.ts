import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { MatchStatus } from '../../../../common/enums/match-status.enum';

export class QueryMatchesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por competicion' })
  @IsOptional()
  @IsUUID()
  competitionId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por equipo (local o visitante)',
  })
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional({
    enum: MatchStatus,
    description: 'Filtrar por estado del partido',
  })
  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;

  @ApiPropertyOptional({
    description: 'Fecha minima (ISO 8601)',
    example: '2026-06-01',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Fecha maxima (ISO 8601)',
    example: '2026-07-31',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
