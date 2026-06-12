import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { plainToInstance } from 'class-transformer';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from '../../../users/domain/user-repository.interface';
import {
  type IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/refresh-token-repository.interface';
import { AuthResponseDto, UserProfileDto } from '../dto/auth-response.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RegisterDto } from '../dto/register.dto';
import { TokenService } from './token.service';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(
        'Ya existe un usuario con ese correo electronico',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.userRepository.create({
      email: dto.email,
      fullName: dto.fullName,
      passwordHash,
      role: Role.USER,
    });

    return this.buildAuthResponse(user);
  }

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

    return this.buildAuthResponse(user);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    const payload = this.verifyRefreshTokenOrThrow(dto.refreshToken);

    const record = await this.refreshTokenRepository.findById(payload.jti);
    const tokenHash = this.tokenService.hashToken(dto.refreshToken);

    if (
      !record ||
      record.revokedAt ||
      record.expiresAt < new Date() ||
      record.tokenHash !== tokenHash
    ) {
      throw new UnauthorizedException('Refresh token invalido o expirado');
    }

    const user = await this.userRepository.findById(record.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no valido');
    }

    // Rotacion: se revoca el token usado y se emite un par nuevo
    await this.refreshTokenRepository.revoke(record.id);

    return this.buildAuthResponse(user);
  }

  async logout(dto: RefreshTokenDto): Promise<void> {
    try {
      const payload = this.verifyRefreshTokenOrThrow(dto.refreshToken);
      await this.refreshTokenRepository.revoke(payload.jti);
    } catch {
      // El logout es idempotente: un token ya invalido no produce error
    }
  }

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.toProfile(user);
  }

  private verifyRefreshTokenOrThrow(token: string) {
    try {
      return this.tokenService.verifyRefreshToken(token);
    } catch {
      throw new UnauthorizedException('Refresh token invalido o expirado');
    }
  }

  private async buildAuthResponse(user: User): Promise<AuthResponseDto> {
    const accessToken = this.tokenService.signAccessToken(user);
    const tokenId = randomUUID();
    const refreshToken = this.tokenService.signRefreshToken(user.id, tokenId);

    await this.refreshTokenRepository.create({
      id: tokenId,
      userId: user.id,
      tokenHash: this.tokenService.hashToken(refreshToken),
      expiresAt: this.tokenService.getRefreshTokenExpiryDate(),
    });

    return {
      user: this.toProfile(user),
      tokens: { accessToken, refreshToken },
    };
  }

  private toProfile(user: User): UserProfileDto {
    return plainToInstance(UserProfileDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
