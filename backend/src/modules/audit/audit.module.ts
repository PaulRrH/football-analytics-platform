import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AUDIT_REPOSITORY } from './domain/audit-repository.interface';
import { PrismaAuditRepository } from './infrastructure/repositories/prisma-audit.repository';
import { AuditLogController } from './presentation/controllers/audit-log.controller';
import { AuditInterceptor } from './presentation/interceptors/audit.interceptor';
import { AuditService } from './application/services/audit.service';

@Module({
  controllers: [AuditLogController],
  providers: [
    AuditService,
    {
      provide: AUDIT_REPOSITORY,
      useClass: PrismaAuditRepository,
    },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AuditModule {}
