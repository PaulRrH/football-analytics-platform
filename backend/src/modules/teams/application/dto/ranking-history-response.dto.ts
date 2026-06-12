import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class RankingHistoryResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiPropertyOptional()
  fifaRanking: number | null;

  @Expose()
  @ApiPropertyOptional()
  fifaPoints: number | null;

  @Expose()
  @ApiProperty()
  eloRating: number;

  @Expose()
  @ApiProperty()
  recordedAt: Date;
}
