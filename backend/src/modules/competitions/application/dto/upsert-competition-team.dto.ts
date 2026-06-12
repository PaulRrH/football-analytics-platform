import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class UpsertCompetitionTeamDto {
  @ApiPropertyOptional({ nullable: true, example: 'Grupo A', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  groupName?: string | null;

  @ApiPropertyOptional({ nullable: true, minimum: 1, example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  seed?: number | null;
}
