import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { DashboardService } from '../../application/services/dashboard.service';
import { DashboardRankingDto } from '../../application/dto/dashboard-ranking.dto';
import { DashboardSummaryResponseDto } from '../../application/dto/dashboard-summary-response.dto';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumen agregado de la plataforma' })
  getSummary(): Promise<DashboardSummaryResponseDto> {
    return this.dashboardService.getSummary();
  }

  @Get('rankings')
  @ApiOperation({ summary: 'Ranking Elo paginado de selecciones' })
  getRankings(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<DashboardRankingDto>> {
    return this.dashboardService.getRankings(query);
  }
}
