import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../../../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'editor@worldcup-analytics.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Ana Editor' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ enum: Role, default: Role.EDITOR })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
