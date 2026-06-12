import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Role, User } from '@prisma/client';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../users/domain/user-repository.interface';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let repository: jest.Mocked<IUserRepository>;
  let jwtService: jest.Mocked<JwtService>;

  const passwordHash = bcrypt.hashSync('Admin123!', 10);

  const adminUser: User = {
    id: 'user-1',
    email: 'admin@worldcup-analytics.local',
    passwordHash,
    name: 'Administrador',
    role: Role.ADMIN,
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
        AuthService,
        { provide: USER_REPOSITORY, useValue: repository },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('signed-token') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('login', () => {
    it('devuelve un token y el usuario cuando las credenciales son correctas', async () => {
      repository.findByEmail.mockResolvedValue(adminUser);

      const result = await service.login({
        email: adminUser.email,
        password: 'Admin123!',
      });

      expect(result.accessToken).toBe('signed-token');
      expect(result.user.id).toBe(adminUser.id);
      expect(result.user.role).toBe(Role.ADMIN);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      });
    });

    it('lanza UnauthorizedException si el usuario no existe', async () => {
      repository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'missing@example.com', password: 'whatever' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el usuario esta inactivo', async () => {
      repository.findByEmail.mockResolvedValue({
        ...adminUser,
        isActive: false,
      });

      await expect(
        service.login({ email: adminUser.email, password: 'Admin123!' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lanza UnauthorizedException si la contrasena es incorrecta', async () => {
      repository.findByEmail.mockResolvedValue(adminUser);

      await expect(
        service.login({ email: adminUser.email, password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('me', () => {
    it('devuelve los datos del usuario autenticado', () => {
      const result = service.me({
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      });

      expect(result.id).toBe(adminUser.id);
      expect(result.email).toBe(adminUser.email);
      expect(result.role).toBe(Role.ADMIN);
    });
  });
});
