import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { Role } from '../../../../common/enums/role.enum';

export class QueryUsersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: Role, description: 'Filtrar por rol' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
