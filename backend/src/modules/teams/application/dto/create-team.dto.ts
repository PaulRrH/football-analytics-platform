import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Confederation } from '../../../../common/enums/confederation.enum';

export class CreateTeamDto {
  @ApiProperty({ example: 'Argentina' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'ARG', minLength: 3, maxLength: 3 })
  @IsString()
  @Length(3, 3)
  shortName: string;

  @ApiProperty({ example: 'Argentina' })
  @IsString()
  @MinLength(2)
  country: string;

  @ApiProperty({ enum: Confederation, example: Confederation.CONMEBOL })
  @IsEnum(Confederation)
  confederation: Confederation;

  @ApiPropertyOptional({ example: 'https://flagcdn.com/w320/ar.png' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  fifaRanking?: number;

  @ApiPropertyOptional({ example: 1850.5 })
  @IsOptional()
  @IsNumber()
  fifaRankingPoints?: number;

  @ApiPropertyOptional({ example: 2100, minimum: 0, maximum: 4000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(4000)
  eloRating?: number;

  @ApiPropertyOptional({ example: 1893 })
  @IsOptional()
  @IsInt()
  @Min(1800)
  foundedYear?: number;
}
