import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Confederation } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DashboardRankingDto {
  @Expose()
  @ApiProperty()
  rank: number;

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
  @ApiPropertyOptional({ nullable: true })
  logoUrl: string | null;

  @Expose()
  @ApiProperty({ enum: Confederation })
  confederation: Confederation;

  @Expose()
  @ApiProperty()
  eloRating: number;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  fifaRanking: number | null;
}
