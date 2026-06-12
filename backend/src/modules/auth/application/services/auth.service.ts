import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from '../../../users/domain/user-repository.interface';
import { AuthenticatedUser } from '../../../../common/interfaces/authenticated-user.interface';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { AuthUserDto } from '../dto/auth-user.dto';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return plainToInstance(
      AuthResponseDto,
      {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { excludeExtraneousValues: true },
    );
  }

  me(user: AuthenticatedUser): AuthUserDto {
    return plainToInstance(AuthUserDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
