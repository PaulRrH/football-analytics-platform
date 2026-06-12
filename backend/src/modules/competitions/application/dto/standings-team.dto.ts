import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StandingsTeamDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  shortName: string;

  @ApiPropertyOptional({ nullable: true })
  logoUrl: string | null;
}
