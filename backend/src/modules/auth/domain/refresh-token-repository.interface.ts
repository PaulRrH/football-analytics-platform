export const REFRESH_TOKEN_REPOSITORY = 'REFRESH_TOKEN_REPOSITORY';

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface CreateRefreshTokenData {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

/**
 * Puerto (Repository pattern) para los refresh tokens persistidos,
 * usado para rotacion y revocacion.
 */
export interface IRefreshTokenRepository {
  create(data: CreateRefreshTokenData): Promise<void>;
  findById(id: string): Promise<RefreshTokenRecord | null>;
  revoke(id: string): Promise<void>;
}
