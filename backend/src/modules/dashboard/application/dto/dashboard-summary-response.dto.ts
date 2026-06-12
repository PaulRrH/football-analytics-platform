import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import type {
  DashboardCounts,
  DashboardMatchesByStatus,
} from '../../domain/dashboard-repository.interface';
import { DashboardMatchSummaryDto } from './dashboard-match-summary.dto';
import { DashboardTeamSummaryDto } from './dashboard-team-summary.dto';

@Exclude()
export class DashboardSummaryResponseDto {
  @Expose()
  @ApiProperty({
    example: {
      teams: 18,
      competitions: 44,
      matches: 2465,
      predictions: 0,
      simulations: 0,
    },
  })
  counts: DashboardCounts;

  @Expose()
  @ApiProperty({
    example: {
      scheduled: 10,
      live: 0,
      finished: 2455,
      postponed: 0,
      cancelled: 0,
    },
  })
  matchesByStatus: DashboardMatchesByStatus;

  @Expose()
  @Type(() => DashboardTeamSummaryDto)
  @ApiProperty({ type: DashboardTeamSummaryDto, isArray: true })
  topTeams: DashboardTeamSummaryDto[];

  @Expose()
  @Type(() => DashboardMatchSummaryDto)
  @ApiProperty({ type: DashboardMatchSummaryDto, isArray: true })
  upcomingMatches: DashboardMatchSummaryDto[];

  @Expose()
  @Type(() => DashboardMatchSummaryDto)
  @ApiProperty({ type: DashboardMatchSummaryDto, isArray: true })
  recentResults: DashboardMatchSummaryDto[];
}
