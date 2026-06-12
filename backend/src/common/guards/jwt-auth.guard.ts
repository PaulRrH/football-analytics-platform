import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RequestWithUser } from '../decorators/current-user.decorator';

/**
 * Exige que `request.user` ya este poblado (por OptionalJwtAuthGuard, global)
 * con un token JWT valido. Usar junto a RolesGuard en rutas protegidas.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (!request.user) {
      throw new UnauthorizedException('Se requiere autenticacion');
    }

    return true;
  }
}
