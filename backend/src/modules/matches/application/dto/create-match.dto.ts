import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { MatchStage } from '../../../../common/enums/match-stage.enum';
import { MatchStatus } from '../../../../common/enums/match-status.enum';

export class CreateMatchDto {
  @ApiProperty({
    description: 'ID de la competicion a la que pertenece el partido',
  })
  @IsUUID()
  competitionId: string;

  @ApiProperty({ description: 'ID del equipo local' })
  @IsUUID()
  homeTeamId: string;

  @ApiProperty({ description: 'ID del equipo visitante' })
  @IsUUID()
  awayTeamId: string;

  @ApiProperty({ example: '2026-06-11T18:00:00.000Z' })
  @IsDateString()
  matchDate: string;

  @ApiPropertyOptional({ example: 'Estadio Azteca' })
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional({ example: 'Ciudad de Mexico' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ enum: MatchStage, example: MatchStage.GROUP_STAGE })
  @IsEnum(MatchStage)
  stage: MatchStage;

  @ApiPropertyOptional({ example: 'Jornada 1' })
  @IsOptional()
  @IsString()
  round?: string;

  @ApiPropertyOptional({ example: 2, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  homeGoals?: number;

  @ApiPropertyOptional({ example: 1, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  awayGoals?: number;

  @ApiPropertyOptional({ enum: MatchStatus, default: MatchStatus.SCHEDULED })
  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;
}
