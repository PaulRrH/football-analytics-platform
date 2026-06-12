import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { Confederation } from '../../../../common/enums/confederation.enum';

export class QueryTeamsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: Confederation,
    description: 'Filtrar por confederacion',
  })
  @IsOptional()
  @IsEnum(Confederation)
  confederation?: Confederation;

  @ApiPropertyOptional({ description: 'Busqueda por nombre o pais' })
  @IsOptional()
  @IsString()
  search?: string;
}
