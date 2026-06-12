import { ApiProperty } from '@nestjs/swagger';
import { StatsTeamDto } from './stats-team.dto';

export class TeamFormMatchDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  matchDate: Date;

  @ApiProperty()
  competitionName: string;

  @ApiProperty({ type: StatsTeamDto })
  opponent: StatsTeamDto;

  @ApiProperty()
  isHome: boolean;

  @ApiProperty()
  goalsFor: number;

  @ApiProperty()
  goalsAgainst: number;

  @ApiProperty({ enum: ['W', 'D', 'L'] })
  result: 'W' | 'D' | 'L';
}
