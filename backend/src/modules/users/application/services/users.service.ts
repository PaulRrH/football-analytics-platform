import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { PaginatedResponseDto } from '../../../../common/dto/paginated-response.dto';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from '../../domain/user-repository.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { QueryUsersDto } from '../dto/query-users.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(
        'Ya existe un usuario con ese correo electronico',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.userRepository.create({
      email: dto.email,
      fullName: dto.fullName,
      role: dto.role,
      passwordHash,
    });

    return this.toResponse(user);
  }

  async findAll(
    query: QueryUsersDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userRepository.findAll({ skip, take: limit, role: query.role }),
      this.userRepository.count({ role: query.role }),
    ]);

    return new PaginatedResponseDto(
      users.map((u) => this.toResponse(u)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }
    return this.toResponse(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepository.findByEmail(dto.email);
      if (existing) {
        throw new ConflictException(
          'Ya existe un usuario con ese correo electronico',
        );
      }
    }

    const updated = await this.userRepository.update(id, {
      email: dto.email,
      fullName: dto.fullName,
      role: dto.role,
      isActive: dto.isActive,
      passwordHash: dto.password
        ? await bcrypt.hash(dto.password, SALT_ROUNDS)
        : undefined,
    });

    return this.toResponse(updated);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }
    await this.userRepository.delete(id);
  }

  private toResponse(user: User): UserResponseDto {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
