import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { AuthUserDto } from './auth-user.dto';

@Exclude()
export class AuthResponseDto {
  @Expose()
  @ApiProperty()
  accessToken: string;

  @Expose()
  @Type(() => AuthUserDto)
  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}
