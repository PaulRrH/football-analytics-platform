import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { StandingsRowDto } from './standings-row.dto';

export class StandingsGroupDto {
  @ApiPropertyOptional({ nullable: true })
  groupName: string | null;

  @ApiProperty({ type: [StandingsRowDto] })
  standings: StandingsRowDto[];
}
