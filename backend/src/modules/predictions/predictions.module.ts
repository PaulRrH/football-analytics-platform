import { Module } from '@nestjs/common';
import { PREDICTION_REPOSITORY } from './domain/prediction-repository.interface';
import { PrismaPredictionRepository } from './infrastructure/repositories/prisma-prediction.repository';
import { PredictionsController } from './presentation/controllers/predictions.controller';
import { PredictionsService } from './application/services/predictions.service';

@Module({
  controllers: [PredictionsController],
  providers: [
    PredictionsService,
    {
      provide: PREDICTION_REPOSITORY,
      useClass: PrismaPredictionRepository,
    },
  ],
})
export class PredictionsModule {}
