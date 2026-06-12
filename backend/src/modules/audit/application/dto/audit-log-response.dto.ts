import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class AuditLogResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiPropertyOptional()
  userId: string | null;

  @Expose()
  @ApiPropertyOptional()
  userEmail: string | null;

  @Expose()
  @ApiProperty()
  method: string;

  @Expose()
  @ApiProperty()
  path: string;

  @Expose()
  @ApiProperty()
  entityType: string;

  @Expose()
  @ApiPropertyOptional()
  entityId: string | null;

  @Expose()
  @ApiProperty()
  statusCode: number;

  @Expose()
  @ApiProperty()
  createdAt: Date;
}
