import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DashboardTeamRefDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  shortName: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  logoUrl: string | null;
}
