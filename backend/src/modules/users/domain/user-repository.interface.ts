import { Role, User } from '@prisma/client';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  fullName: string;
  role: Role;
}

export interface UpdateUserData {
  fullName?: string;
  email?: string;
  passwordHash?: string;
  role?: Role;
  isActive?: boolean;
}

export interface FindAllUsersParams {
  skip: number;
  take: number;
  role?: Role;
}

/**
 * Puerto (Repository pattern) para el agregado User.
 * La implementacion concreta vive en infrastructure/repositories.
 */
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  delete(id: string): Promise<void>;
  findAll(params: FindAllUsersParams): Promise<User[]>;
  count(params: { role?: Role }): Promise<number>;
}
