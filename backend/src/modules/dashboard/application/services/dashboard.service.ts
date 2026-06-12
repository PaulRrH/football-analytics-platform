import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PaginatedResponseDto } from '../../../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  DASHBOARD_REPOSITORY,
  type IDashboardRepository,
} from '../../domain/dashboard-repository.interface';
import { DashboardRankingDto } from '../dto/dashboard-ranking.dto';
import { DashboardSummaryResponseDto } from '../dto/dashboard-summary-response.dto';

export const DASHBOARD_TOP_TEAMS_LIMIT = 10;
export const DASHBOARD_RECENT_LIMIT = 5;

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepository: IDashboardRepository,
  ) {}

  async getSummary(): Promise<DashboardSummaryResponseDto> {
    const [counts, matchesByStatus, topTeams, upcomingMatches, recentResults] =
      await Promise.all([
        this.dashboardRepository.getCounts(),
        this.dashboardRepository.getMatchesByStatus(),
        this.dashboardRepository.findTopTeamsByElo(DASHBOARD_TOP_TEAMS_LIMIT),
        this.dashboardRepository.findUpcomingMatches(DASHBOARD_RECENT_LIMIT),
        this.dashboardRepository.findRecentResults(DASHBOARD_RECENT_LIMIT),
      ]);

    return plainToInstance(
      DashboardSummaryResponseDto,
      { counts, matchesByStatus, topTeams, upcomingMatches, recentResults },
      { excludeExtraneousValues: true },
    );
  }

  async getRankings(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<DashboardRankingDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const { data, total } = await this.dashboardRepository.findRankedTeams(
      (page - 1) * limit,
      limit,
    );

    const ranked = data.map((team, index) =>
      plainToInstance(
        DashboardRankingDto,
        { ...team, rank: (page - 1) * limit + index + 1 },
        { excludeExtraneousValues: true },
      ),
    );

    return new PaginatedResponseDto(ranked, total, page, limit);
  }
}
