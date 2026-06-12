import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { MatchStage } from '@prisma/client';
import { DashboardCompetitionSummaryDto } from './dashboard-competition-summary.dto';
import { DashboardTeamRefDto } from './dashboard-team-ref.dto';

@Exclude()
export class DashboardMatchSummaryDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  matchDate: Date;

  @Expose()
  @ApiProperty({ enum: MatchStage })
  stage: MatchStage;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  homeGoals: number | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  awayGoals: number | null;

  @Expose()
  @Type(() => DashboardTeamRefDto)
  @ApiProperty({ type: DashboardTeamRefDto })
  homeTeam: DashboardTeamRefDto;

  @Expose()
  @Type(() => DashboardTeamRefDto)
  @ApiProperty({ type: DashboardTeamRefDto })
  awayTeam: DashboardTeamRefDto;

  @Expose()
  @Type(() => DashboardCompetitionSummaryDto)
  @ApiProperty({ type: DashboardCompetitionSummaryDto })
  competition: DashboardCompetitionSummaryDto;
}
