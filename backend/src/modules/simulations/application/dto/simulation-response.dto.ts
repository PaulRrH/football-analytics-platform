import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SimulationStatus } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SimulationResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  competitionId: string;

  @Expose()
  @ApiProperty()
  iterations: number;

  @Expose()
  @ApiProperty({ enum: SimulationStatus })
  status: SimulationStatus;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  startedAt: Date | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  completedAt: Date | null;

  @Expose()
  @ApiProperty()
  createdAt: Date;
}
