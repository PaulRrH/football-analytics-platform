import { Inject, Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PaginatedResponseDto } from '../../../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  AUDIT_REPOSITORY,
  type CreateAuditLogData,
  type IAuditRepository,
} from '../../domain/audit-repository.interface';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @Inject(AUDIT_REPOSITORY)
    private readonly auditRepository: IAuditRepository,
  ) {}

  async record(data: CreateAuditLogData): Promise<void> {
    try {
      await this.auditRepository.create(data);
    } catch (error) {
      this.logger.error('No se pudo registrar el audit log', error);
    }
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<AuditLogResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const { data, total } = await this.auditRepository.findAll({
      skip,
      take: limit,
    });

    return new PaginatedResponseDto(
      data.map((entry) =>
        plainToInstance(AuditLogResponseDto, entry, {
          excludeExtraneousValues: true,
        }),
      ),
      total,
      page,
      limit,
    );
  }
}
