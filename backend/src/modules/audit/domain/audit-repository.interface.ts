import { AuditLog } from '@prisma/client';

export const AUDIT_REPOSITORY = 'AUDIT_REPOSITORY';

export interface CreateAuditLogData {
  userId: string | null;
  userEmail: string | null;
  method: string;
  path: string;
  entityType: string;
  entityId: string | null;
  statusCode: number;
}

export interface FindAllAuditParams {
  skip: number;
  take: number;
}

/**
 * Puerto (Repository pattern) para el agregado AuditLog.
 * La implementacion concreta vive en infrastructure/repositories.
 */
export interface IAuditRepository {
  create(data: CreateAuditLogData): Promise<AuditLog>;
  findAll(
    params: FindAllAuditParams,
  ): Promise<{ data: AuditLog[]; total: number }>;
}
