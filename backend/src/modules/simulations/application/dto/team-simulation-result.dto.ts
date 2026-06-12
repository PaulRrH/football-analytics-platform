import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { TeamSummaryDto } from './team-summary.dto';

@Exclude()
export class TeamSimulationResultDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @Type(() => TeamSummaryDto)
  @ApiProperty({ type: TeamSummaryDto })
  team: TeamSummaryDto;

  @Expose()
  @ApiProperty()
  groupStageProbability: number;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  expectedPosition: number | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  roundOf16Probability: number | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  quarterFinalProbability: number | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  semiFinalProbability: number | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  finalProbability: number | null;

  @Expose()
  @ApiProperty()
  championProbability: number;
}
