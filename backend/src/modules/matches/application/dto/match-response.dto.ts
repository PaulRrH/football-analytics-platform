import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { MatchStage } from '../../../../common/enums/match-stage.enum';
import { MatchStatus } from '../../../../common/enums/match-status.enum';
import { MatchStatisticResponseDto } from './match-statistic-response.dto';
import { MatchTeamSummaryDto } from './match-team-summary.dto';

@Exclude()
export class MatchResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  competitionId: string;

  @Expose()
  @Type(() => MatchTeamSummaryDto)
  @ApiProperty({ type: MatchTeamSummaryDto })
  homeTeam: MatchTeamSummaryDto;

  @Expose()
  @Type(() => MatchTeamSummaryDto)
  @ApiProperty({ type: MatchTeamSummaryDto })
  awayTeam: MatchTeamSummaryDto;

  @Expose()
  @ApiProperty()
  matchDate: Date;

  @Expose()
  @ApiPropertyOptional()
  venue: string | null;

  @Expose()
  @ApiPropertyOptional()
  city: string | null;

  @Expose()
  @ApiProperty({ enum: MatchStage })
  stage: MatchStage;

  @Expose()
  @ApiPropertyOptional()
  round: string | null;

  @Expose()
  @ApiPropertyOptional()
  homeGoals: number | null;

  @Expose()
  @ApiPropertyOptional()
  awayGoals: number | null;

  @Expose()
  @ApiProperty({ enum: MatchStatus })
  status: MatchStatus;

  @Expose()
  @Type(() => MatchStatisticResponseDto)
  @ApiPropertyOptional({ type: [MatchStatisticResponseDto] })
  statistics?: MatchStatisticResponseDto[];

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}
