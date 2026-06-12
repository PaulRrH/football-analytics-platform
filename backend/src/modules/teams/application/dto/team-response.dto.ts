import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { Confederation } from '../../../../common/enums/confederation.enum';

@Exclude()
export class TeamResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  shortName: string;

  @Expose()
  @ApiProperty()
  country: string;

  @Expose()
  @ApiProperty({ enum: Confederation })
  confederation: Confederation;

  @Expose()
  @ApiPropertyOptional()
  logoUrl: string | null;

  @Expose()
  @ApiPropertyOptional()
  fifaRanking: number | null;

  @Expose()
  @ApiPropertyOptional()
  fifaRankingPoints: number | null;

  @Expose()
  @ApiProperty()
  eloRating: number;

  @Expose()
  @ApiPropertyOptional()
  foundedYear: number | null;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}
