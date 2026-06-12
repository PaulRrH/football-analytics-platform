import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PredictionResponseDto } from '../../application/dto/prediction-response.dto';
import { PredictionsService } from '../../application/services/predictions.service';

@ApiTags('predictions')
@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Get('matches/:id')
  @ApiOperation({
    summary: 'Obtener las predicciones mas recientes de un partido',
  })
  getMatchPredictions(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PredictionResponseDto[]> {
    return this.predictionsService.getMatchPredictions(id);
  }

  @Post('matches/:id/generate')
  @ApiOperation({
    summary: 'Generar predicciones (Elo, Poisson, Ensemble) para un partido',
  })
  generate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PredictionResponseDto[]> {
    return this.predictionsService.generatePredictions(id);
  }
}
