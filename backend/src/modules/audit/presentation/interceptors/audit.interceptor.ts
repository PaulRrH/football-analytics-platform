import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppConfig } from '../../../../config/configuration';
import { RequestWithUser } from '../../../../common/decorators/current-user.decorator';
import { AuditService } from '../../application/services/audit.service';

const AUDITED_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
const EXCLUDED_PREFIXES = ['/auth', '/admin'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly apiPrefix: string;

  constructor(
    private readonly auditService: AuditService,
    configService: ConfigService<AppConfig, true>,
  ) {
    this.apiPrefix = configService.get('apiPrefix', { infer: true });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<RequestWithUser>();

    if (!AUDITED_METHODS.has(request.method)) {
      return next.handle();
    }

    const path = this.stripApiPrefix(request.path);
    if (EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      return next.handle();
    }

    const response = httpContext.getResponse<Response>();
    const entityType = path.split('/').filter(Boolean)[0] ?? path;
    const entityId = (request.params as Record<string, string>).id ?? null;

    return next.handle().pipe(
      tap(() => {
        void this.auditService.record({
          userId: request.user?.id ?? null,
          userEmail: request.user?.email ?? null,
          method: request.method,
          path,
          entityType,
          entityId,
          statusCode: response.statusCode,
        });
      }),
    );
  }

  private stripApiPrefix(path: string): string {
    const prefix = `/${this.apiPrefix}`;
    return path.startsWith(prefix) ? path.slice(prefix.length) || '/' : path;
  }
}
