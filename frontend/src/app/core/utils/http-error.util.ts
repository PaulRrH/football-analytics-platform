import { HttpErrorResponse } from '@angular/common/http';

const DEFAULT_MESSAGE = 'Ocurrió un error inesperado. Inténtalo de nuevo.';

export function resolveErrorMessage(err: unknown, fallback = DEFAULT_MESSAGE): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { message?: string | string[] } | null;

    if (body?.message) {
      return Array.isArray(body.message) ? body.message.join(', ') : body.message;
    }

    if (err.status === 401) {
      return 'Credenciales inválidas.';
    }

    if (err.status === 409) {
      return 'El correo electrónico ya está registrado.';
    }
  }

  return fallback;
}
