import { Module } from '@nestjs/common';
import { TEAM_REPOSITORY } from './domain/team-repository.interface';
import { PrismaTeamRepository } from './infrastructure/repositories/prisma-team.repository';
import { TeamsController } from './presentation/controllers/teams.controller';
import { EloRatingService } from './application/services/elo-rating.service';
import { TeamsService } from './application/services/teams.service';

@Module({
  controllers: [TeamsController],
  providers: [
    TeamsService,
    EloRatingService,
    {
      provide: TEAM_REPOSITORY,
      useClass: PrismaTeamRepository,
    },
  ],
  exports: [TEAM_REPOSITORY, EloRatingService],
})
export class TeamsModule {}
