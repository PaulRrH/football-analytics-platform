import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { CompetitionStatus } from '../../../../common/enums/competition-status.enum';
import { CompetitionType } from '../../../../common/enums/competition-type.enum';

export class QueryCompetitionsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: CompetitionType,
    description: 'Filtrar por tipo de competicion',
  })
  @IsOptional()
  @IsEnum(CompetitionType)
  type?: CompetitionType;

  @ApiPropertyOptional({
    enum: CompetitionStatus,
    description: 'Filtrar por estado de la competicion',
  })
  @IsOptional()
  @IsEnum(CompetitionStatus)
  status?: CompetitionStatus;

  @ApiPropertyOptional({ description: 'Filtrar por temporada' })
  @IsOptional()
  @IsString()
  season?: string;

  @ApiPropertyOptional({ description: 'Busqueda por nombre' })
  @IsOptional()
  @IsString()
  search?: string;
}
