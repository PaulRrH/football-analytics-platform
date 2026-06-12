import { PaginationQuery } from './pagination.model';
import { Role } from './role.enum';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserQuery = PaginationQuery;

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role?: Role;
}

export interface UpdateUserRequest {
  name?: string;
  role?: Role;
  isActive?: boolean;
  password?: string;
}
