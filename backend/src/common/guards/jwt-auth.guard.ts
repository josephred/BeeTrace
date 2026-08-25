import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { firstValueFrom, isObservable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * En rutas privadas exige token. En rutas publicas no lo exige, pero si viene
   * uno valido igual identifica al usuario: `POST /auth/register` necesita saber
   * si quien llama es un ADMIN para permitirle asignar rol y organizacion.
   * Un token invalido en ruta publica se ignora en silencio.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isPublic) {
      return this.resolve(super.canActivate(context));
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (!request.headers.authorization) return true;

    try {
      await this.resolve(super.canActivate(context));
    } catch {
      // Ruta publica: seguir sin usuario autenticado.
    }
    return true;
  }

  private async resolve(
    result: boolean | Promise<boolean> | ReturnType<typeof firstValueFrom> | unknown,
  ): Promise<boolean> {
    if (isObservable(result)) {
      return Boolean(await firstValueFrom(result));
    }
    return Boolean(await result);
  }
}
