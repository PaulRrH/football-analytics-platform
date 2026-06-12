import { Test, TestingModule } from '@nestjs/testing';
import { AuditLog } from '@prisma/client';
import {
  AUDIT_REPOSITORY,
  IAuditRepository,
} from '../../domain/audit-repository.interface';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;
  let repository: jest.Mocked<IAuditRepository>;

  const entry: AuditLog = {
    id: 'audit-1',
    userId: null,
    userEmail: null,
    method: 'POST',
    path: '/teams',
    entityType: 'teams',
    entityId: null,
    statusCode: 201,
    createdAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: AUDIT_REPOSITORY, useValue: repository },
      ],
    }).compile();

    service = module.get(AuditService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('record', () => {
    it('persiste la entrada del audit log', async () => {
      repository.create.mockResolvedValue(entry);

      await service.record({
        userId: null,
        userEmail: null,
        method: 'POST',
        path: '/teams',
        entityType: 'teams',
        entityId: null,
        statusCode: 201,
      });

      expect(repository.create).toHaveBeenCalledWith({
        userId: null,
        userEmail: null,
        method: 'POST',
        path: '/teams',
        entityType: 'teams',
        entityId: null,
        statusCode: 201,
      });
    });

    it('no propaga errores si el repositorio falla', async () => {
      repository.create.mockRejectedValue(new Error('db down'));

      await expect(
        service.record({
          userId: null,
          userEmail: null,
          method: 'POST',
          path: '/teams',
          entityType: 'teams',
          entityId: null,
          statusCode: 201,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('retorna una respuesta paginada', async () => {
      repository.findAll.mockResolvedValue({ data: [entry], total: 1 });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(entry.id);
      expect(result.meta.total).toBe(1);
    });
  });
});
