import { Module } from '@nestjs/common';
import { STATS_REPOSITORY } from './domain/stats-repository.interface';
import { PrismaStatsRepository } from './infrastructure/repositories/prisma-stats.repository';
import { StatsController } from './presentation/controllers/stats.controller';
import { StatsService } from './application/services/stats.service';

@Module({
  controllers: [StatsController],
  providers: [
    StatsService,
    {
      provide: STATS_REPOSITORY,
      useClass: PrismaStatsRepository,
    },
  ],
})
export class StatsModule {}
