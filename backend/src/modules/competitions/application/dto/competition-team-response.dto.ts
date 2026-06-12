import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { StandingsTeamDto } from './standings-team.dto';

@Exclude()
export class CompetitionTeamResponseDto {
  @Expose()
  @ApiProperty()
  teamId: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  groupName: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  seed: number | null;

  @Expose()
  @Type(() => StandingsTeamDto)
  @ApiProperty({ type: StandingsTeamDto })
  team: StandingsTeamDto;
}
