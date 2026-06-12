import { Module } from '@nestjs/common';
import { MATCH_REPOSITORY } from './domain/match-repository.interface';
import { PrismaMatchRepository } from './infrastructure/repositories/prisma-match.repository';
import { MatchesController } from './presentation/controllers/matches.controller';
import { MatchesService } from './application/services/matches.service';

@Module({
  controllers: [MatchesController],
  providers: [
    MatchesService,
    {
      provide: MATCH_REPOSITORY,
      useClass: PrismaMatchRepository,
    },
  ],
  exports: [MATCH_REPOSITORY],
})
export class MatchesModule {}
