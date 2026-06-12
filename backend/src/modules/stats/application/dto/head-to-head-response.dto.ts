import { ApiProperty } from '@nestjs/swagger';
import { HeadToHeadMatchDto } from './head-to-head-match.dto';
import { StatsTeamDto } from './stats-team.dto';

export class HeadToHeadResponseDto {
  @ApiProperty({ type: StatsTeamDto })
  teamA: StatsTeamDto;

  @ApiProperty({ type: StatsTeamDto })
  teamB: StatsTeamDto;

  @ApiProperty()
  totalMatches: number;

  @ApiProperty()
  teamAWins: number;

  @ApiProperty()
  teamBWins: number;

  @ApiProperty()
  draws: number;

  @ApiProperty()
  teamAGoals: number;

  @ApiProperty()
  teamBGoals: number;

  @ApiProperty({
    type: [HeadToHeadMatchDto],
    description: 'Partidos, del mas reciente al mas antiguo',
  })
  matches: HeadToHeadMatchDto[];
}
