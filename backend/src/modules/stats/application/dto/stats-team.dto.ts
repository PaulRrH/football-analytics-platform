import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StatsTeamDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  shortName: string;

  @ApiPropertyOptional({ nullable: true })
  logoUrl: string | null;
}
