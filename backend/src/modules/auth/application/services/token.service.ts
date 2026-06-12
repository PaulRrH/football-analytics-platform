import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { User } from '@prisma/client';
import { parseDurationToMs } from '../../../../common/utils/duration.util';
import { AppConfig } from '../../../../config/configuration';
import {
  JwtPayload,
  RefreshTokenPayload,
} from '../../domain/jwt-payload.interface';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  signAccessToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.accessSecret', { infer: true }),
      expiresIn: this.configService.get('jwt.accessTtl', { infer: true }),
    });
  }

  signRefreshToken(userId: string, tokenId: string): string {
    const payload: RefreshTokenPayload = { sub: userId, jti: tokenId };
    return this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.refreshSecret', { infer: true }),
      expiresIn: this.configService.get('jwt.refreshTtl', { infer: true }),
    });
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    return this.jwtService.verify<RefreshTokenPayload>(token, {
      secret: this.configService.get('jwt.refreshSecret', { infer: true }),
    });
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  getRefreshTokenExpiryDate(): Date {
    const ttl = this.configService.get('jwt.refreshTtl', { infer: true });
    return new Date(Date.now() + parseDurationToMs(ttl));
  }
}
