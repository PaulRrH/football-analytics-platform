import { HttpModule, HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';
import { CompetitionsModule } from '../competitions/competitions.module';
import { MatchesModule } from '../matches/matches.module';
import { TeamsModule } from '../teams/teams.module';
import { SPORTS_DATA_PROVIDER } from './domain/sports-data-provider.interface';
import { FootballDataProvider } from './infrastructure/providers/football-data.provider';
import { NullSportsDataProvider } from './infrastructure/providers/null-sports-data.provider';
import { SyncController } from './presentation/controllers/sync.controller';
import { SyncService } from './application/services/sync.service';

@Module({
  imports: [
    HttpModule.register({ timeout: 10_000 }),
    TeamsModule,
    CompetitionsModule,
    MatchesModule,
  ],
  controllers: [SyncController],
  providers: [
    SyncService,
    {
      provide: SPORTS_DATA_PROVIDER,
      useFactory: (
        config: ConfigService<AppConfig, true>,
        http: HttpService,
      ) =>
        config.get('externalApi.footballData.apiKey', { infer: true })
          ? new FootballDataProvider(config, http)
          : new NullSportsDataProvider(),
      inject: [ConfigService, HttpService],
    },
  ],
})
export class SyncModule {}
