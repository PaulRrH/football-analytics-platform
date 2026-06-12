import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { PredictionModel } from '../../../../common/enums/prediction-model.enum';

@Exclude()
export class PredictionResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  matchId: string;

  @Expose()
  @ApiProperty({ enum: PredictionModel })
  model: PredictionModel;

  @Expose()
  @ApiProperty()
  homeWinProbability: number;

  @Expose()
  @ApiProperty()
  drawProbability: number;

  @Expose()
  @ApiProperty()
  awayWinProbability: number;

  @Expose()
  @ApiPropertyOptional()
  predictedHomeGoals: number | null;

  @Expose()
  @ApiPropertyOptional()
  predictedAwayGoals: number | null;

  @Expose()
  @ApiProperty()
  generatedAt: Date;
}
