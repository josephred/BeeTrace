import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../decorators';
import type { AuthenticatedUser, UserRoleName } from '../types';

/** RBAC. La autorizacion contextual por organizacion vive en AccessControlService. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<UserRoleName[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) return false;
    // ADMIN es el rol de plataforma: nunca queda fuera por omision en un decorador.
    if (user.role === 'ADMIN') return true;

    if (!required.includes(user.role)) {
      throw new ForbiddenException(
        `Se requiere alguno de los roles: ${required.join(', ')}. Rol actual: ${user.role}.`,
      );
    }
    return true;
  }
}
