import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MatchStatisticResponseDto {
  @Expose()
  @ApiProperty()
  teamId: string;

  @Expose()
  @ApiPropertyOptional()
  possession: number | null;

  @Expose()
  @ApiPropertyOptional()
  shotsTotal: number | null;

  @Expose()
  @ApiPropertyOptional()
  shotsOnTarget: number | null;

  @Expose()
  @ApiPropertyOptional()
  corners: number | null;

  @Expose()
  @ApiPropertyOptional()
  fouls: number | null;

  @Expose()
  @ApiPropertyOptional()
  yellowCards: number | null;

  @Expose()
  @ApiPropertyOptional()
  redCards: number | null;

  @Expose()
  @ApiPropertyOptional()
  passes: number | null;

  @Expose()
  @ApiPropertyOptional()
  passAccuracy: number | null;

  @Expose()
  @ApiPropertyOptional()
  offsides: number | null;
}
