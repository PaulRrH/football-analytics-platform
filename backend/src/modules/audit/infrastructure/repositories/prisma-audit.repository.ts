import { Injectable } from '@nestjs/common';
import { AuditLog } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  CreateAuditLogData,
  FindAllAuditParams,
  IAuditRepository,
} from '../../domain/audit-repository.interface';

@Injectable()
export class PrismaAuditRepository implements IAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateAuditLogData): Promise<AuditLog> {
    return this.prisma.auditLog.create({ data });
  }

  async findAll(
    params: FindAllAuditParams,
  ): Promise<{ data: AuditLog[]; total: number }> {
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count(),
    ]);

    return { data, total };
  }
}
