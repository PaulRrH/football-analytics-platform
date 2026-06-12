import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { CompetitionStatus } from '../../../../common/enums/competition-status.enum';
import { CompetitionType } from '../../../../common/enums/competition-type.enum';

export class CreateCompetitionDto {
  @ApiProperty({ example: 'FIFA World Cup 2026' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ enum: CompetitionType, example: CompetitionType.WORLD_CUP })
  @IsEnum(CompetitionType)
  type: CompetitionType;

  @ApiProperty({ example: '2026' })
  @IsString()
  @MinLength(2)
  season: string;

  @ApiProperty({ example: '2026-06-11' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-07-19' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    enum: CompetitionStatus,
    default: CompetitionStatus.UPCOMING,
  })
  @IsOptional()
  @IsEnum(CompetitionStatus)
  status?: CompetitionStatus;
}
