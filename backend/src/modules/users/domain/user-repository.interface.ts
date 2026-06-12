import { Role, User } from '@prisma/client';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  role?: Role;
  isActive?: boolean;
  passwordHash?: string;
}

export interface FindAllUsersParams {
  skip: number;
  take: number;
}

/**
 * Puerto (Repository pattern) para el agregado User.
 * La implementacion concreta vive en infrastructure/repositories.
 */
export interface IUserRepository {
  findAll(params: FindAllUsersParams): Promise<User[]>;
  count(): Promise<number>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  delete(id: string): Promise<void>;
  countByRole(role: Role): Promise<number>;
}
