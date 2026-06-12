import { ApiProperty } from '@nestjs/swagger';
import { StatsTeamDto } from './stats-team.dto';

export class HeadToHeadMatchDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  matchDate: Date;

  @ApiProperty()
  competitionName: string;

  @ApiProperty({ type: StatsTeamDto })
  homeTeam: StatsTeamDto;

  @ApiProperty({ type: StatsTeamDto })
  awayTeam: StatsTeamDto;

  @ApiProperty()
  homeGoals: number;

  @ApiProperty()
  awayGoals: number;
}
