import { PaginationQuery } from './pagination.model';

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  userEmail: string | null;
  method: string;
  path: string;
  entityType: string;
  entityId: string | null;
  statusCode: number;
  createdAt: string;
}

export type AuditLogQuery = PaginationQuery;
