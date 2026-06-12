import { Module } from '@nestjs/common';
import { DASHBOARD_REPOSITORY } from './domain/dashboard-repository.interface';
import { PrismaDashboardRepository } from './infrastructure/repositories/prisma-dashboard.repository';
import { DashboardController } from './presentation/controllers/dashboard.controller';
import { DashboardService } from './application/services/dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [
    DashboardService,
    {
      provide: DASHBOARD_REPOSITORY,
      useClass: PrismaDashboardRepository,
    },
  ],
})
export class DashboardModule {}
