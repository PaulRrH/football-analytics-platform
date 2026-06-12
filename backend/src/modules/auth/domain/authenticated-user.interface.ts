import { Role } from '../../../common/enums/role.enum';

/**
 * Forma del usuario adjuntado a la request por JwtStrategy
 * tras validar el access token.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}
