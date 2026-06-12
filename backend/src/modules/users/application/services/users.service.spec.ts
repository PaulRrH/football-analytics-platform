import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, User } from '@prisma/client';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/user-repository.interface';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<IUserRepository>;

  const adminUser: User = {
    id: 'user-1',
    email: 'admin@worldcup-analytics.local',
    passwordHash: 'hashed',
    name: 'Administrador',
    role: Role.ADMIN,
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const editorUser: User = {
    id: 'user-2',
    email: 'editor@worldcup-analytics.local',
    passwordHash: 'hashed',
    name: 'Editor',
    role: Role.EDITOR,
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    repository = {
      findAll: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countByRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USER_REPOSITORY, useValue: repository },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('crea un usuario cuando el correo no esta en uso', async () => {
      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockResolvedValue(editorUser);

      const result = await service.create({
        email: editorUser.email,
        name: editorUser.name,
        password: 'Password123!',
      });

      expect(repository.create).toHaveBeenCalled();
      expect(result.id).toBe(editorUser.id);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('lanza ConflictException si el correo ya existe', async () => {
      repository.findByEmail.mockResolvedValue(editorUser);

      await expect(
        service.create({
          email: editorUser.email,
          name: editorUser.name,
          password: 'Password123!',
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('retorna una respuesta paginada', async () => {
      repository.findAll.mockResolvedValue([adminUser]);
      repository.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException cuando no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('actualiza datos basicos de un usuario', async () => {
      repository.findById.mockResolvedValue(editorUser);
      repository.update.mockResolvedValue({
        ...editorUser,
        name: 'Nuevo nombre',
      });

      const result = await service.update(editorUser.id, {
        name: 'Nuevo nombre',
      });

      expect(result.name).toBe('Nuevo nombre');
    });

    it('lanza BadRequestException al degradar al ultimo ADMIN', async () => {
      repository.findById.mockResolvedValue(adminUser);
      repository.countByRole.mockResolvedValue(1);

      await expect(
        service.update(adminUser.id, { role: Role.EDITOR }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException al desactivar al ultimo ADMIN', async () => {
      repository.findById.mockResolvedValue(adminUser);
      repository.countByRole.mockResolvedValue(1);

      await expect(
        service.update(adminUser.id, { isActive: false }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('permite degradar a un ADMIN si hay otros administradores', async () => {
      repository.findById.mockResolvedValue(adminUser);
      repository.countByRole.mockResolvedValue(2);
      repository.update.mockResolvedValue({ ...adminUser, role: Role.EDITOR });

      const result = await service.update(adminUser.id, { role: Role.EDITOR });

      expect(result.role).toBe(Role.EDITOR);
    });
  });

  describe('remove', () => {
    it('lanza BadRequestException al intentar eliminarse a si mismo', async () => {
      await expect(
        service.remove(adminUser.id, {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException cuando no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.remove('missing', {
          id: editorUser.id,
          email: editorUser.email,
          name: editorUser.name,
          role: editorUser.role,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lanza BadRequestException al eliminar al ultimo ADMIN', async () => {
      repository.findById.mockResolvedValue(adminUser);
      repository.countByRole.mockResolvedValue(1);

      await expect(
        service.remove(adminUser.id, {
          id: editorUser.id,
          email: editorUser.email,
          name: editorUser.name,
          role: editorUser.role,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('elimina un usuario cuando no es el ultimo ADMIN', async () => {
      repository.findById.mockResolvedValue(editorUser);

      await service.remove(editorUser.id, {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      });

      expect(repository.delete).toHaveBeenCalledWith(editorUser.id);
    });
  });
});
