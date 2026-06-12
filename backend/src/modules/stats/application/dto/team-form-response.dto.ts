import { ApiProperty } from '@nestjs/swagger';
import { StatsTeamDto } from './stats-team.dto';
import { TeamFormMatchDto } from './team-form-match.dto';

export class TeamFormResponseDto {
  @ApiProperty({ type: StatsTeamDto })
  team: StatsTeamDto;

  @ApiProperty()
  matchesPlayed: number;

  @ApiProperty()
  wins: number;

  @ApiProperty()
  draws: number;

  @ApiProperty()
  losses: number;

  @ApiProperty()
  goalsFor: number;

  @ApiProperty()
  goalsAgainst: number;

  @ApiProperty()
  points: number;

  @ApiProperty({
    type: [String],
    enum: ['W', 'D', 'L'],
    description:
      'Racha de resultados en orden cronologico (del mas antiguo al mas reciente)',
  })
  form: ('W' | 'D' | 'L')[];

  @ApiProperty({
    type: [TeamFormMatchDto],
    description: 'Partidos recientes, del mas reciente al mas antiguo',
  })
  recentMatches: TeamFormMatchDto[];
}
