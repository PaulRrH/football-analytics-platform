import { ApiProperty } from '@nestjs/swagger';
import { StandingsTeamDto } from './standings-team.dto';

export class StandingsRowDto {
  @ApiProperty({ type: StandingsTeamDto })
  team: StandingsTeamDto;

  @ApiProperty()
  played: number;

  @ApiProperty()
  won: number;

  @ApiProperty()
  drawn: number;

  @ApiProperty()
  lost: number;

  @ApiProperty()
  goalsFor: number;

  @ApiProperty()
  goalsAgainst: number;

  @ApiProperty()
  goalDifference: number;

  @ApiProperty()
  points: number;
}
