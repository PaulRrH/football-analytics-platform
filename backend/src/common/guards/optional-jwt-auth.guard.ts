import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

/**
 * Variante de AuthGuard('jwt') que nunca bloquea la request: si llega un
 * token valido, rellena `request.user`; si no, deja pasar la request con
 * `request.user` indefinido. Permite atribuir mutaciones anonimas vs.
 * autenticadas en el audit log sin exigir login en toda la API.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    return true;
  }

  handleRequest<TUser = AuthenticatedUser>(
    _err: unknown,
    user: TUser | false,
  ): TUser | undefined {
    return user ? user : undefined;
  }
}
