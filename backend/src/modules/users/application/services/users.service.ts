import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PaginatedResponseDto } from '../../../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { AuthenticatedUser } from '../../../../common/interfaces/authenticated-user.interface';
import { Role } from '../../../../common/enums/role.enum';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from '../../domain/user-repository.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';

const PASSWORD_SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(
        `Ya existe un usuario con el correo "${dto.email}"`,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);
    const user = await this.userRepository.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      role: dto.role ?? Role.EDITOR,
    });

    return this.toResponse(user);
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userRepository.findAll({ skip, take: limit }),
      this.userRepository.count(),
    ]);

    return new PaginatedResponseDto(
      users.map((u) => this.toResponse(u)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.findUserOrThrow(id);
    return this.toResponse(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findUserOrThrow(id);

    const demotesAdmin = dto.role !== undefined && dto.role !== Role.ADMIN;
    const deactivates = dto.isActive === false;

    if (user.role === Role.ADMIN && (demotesAdmin || deactivates)) {
      await this.ensureNotLastAdmin();
    }

    const data: Parameters<IUserRepository['update']>[1] = {
      name: dto.name,
      role: dto.role,
      isActive: dto.isActive,
    };

    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);
    }

    const updated = await this.userRepository.update(id, data);
    return this.toResponse(updated);
  }

  async remove(id: string, currentUser: AuthenticatedUser): Promise<void> {
    if (id === currentUser.id) {
      throw new BadRequestException('No puedes eliminar tu propio usuario');
    }

    const user = await this.findUserOrThrow(id);

    if (user.role === Role.ADMIN) {
      await this.ensureNotLastAdmin();
    }

    await this.userRepository.delete(id);
  }

  private async ensureNotLastAdmin(): Promise<void> {
    const adminCount = await this.userRepository.countByRole(Role.ADMIN);
    if (adminCount <= 1) {
      throw new BadRequestException(
        'No se puede dejar la plataforma sin administradores',
      );
    }
  }

  private async findUserOrThrow(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }
    return user;
  }

  private toResponse(user: User): UserResponseDto {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
