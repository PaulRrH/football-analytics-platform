import { Module } from '@nestjs/common';
import { COMPETITION_REPOSITORY } from './domain/competition-repository.interface';
import { PrismaCompetitionRepository } from './infrastructure/repositories/prisma-competition.repository';
import { CompetitionsController } from './presentation/controllers/competitions.controller';
import { CompetitionsService } from './application/services/competitions.service';

@Module({
  controllers: [CompetitionsController],
  providers: [
    CompetitionsService,
    {
      provide: COMPETITION_REPOSITORY,
      useClass: PrismaCompetitionRepository,
    },
  ],
  exports: [COMPETITION_REPOSITORY],
})
export class CompetitionsModule {}
