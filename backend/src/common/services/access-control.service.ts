import { ForbiddenException, Injectable } from '@nestjs/common';
import { GLOBAL_SCOPE_ROLES, READ_ONLY_ROLES, type AuthenticatedUser } from '../types';

/**
 * Autorizacion contextual (arquitectura, seccion 47): el rol no alcanza.
 * Un PRODUCTOR con rol valido igualmente no puede tocar los apiarios de otro.
 */
@Injectable()
export class AccessControlService {
  /** true si el usuario ve todas las organizaciones. */
  hasGlobalScope(user: AuthenticatedUser): boolean {
    return GLOBAL_SCOPE_ROLES.includes(user.role);
  }

  isReadOnly(user: AuthenticatedUser): boolean {
    return READ_ONLY_ROLES.includes(user.role);
  }

  /**
   * Organizacion a la que se limita la consulta, o null si el usuario ve todo.
   * Usar como filtro en los listados.
   */
  organizationScope(user: AuthenticatedUser): string | null {
    return this.hasGlobalScope(user) ? null : this.requireOrganization(user);
  }

  requireOrganization(user: AuthenticatedUser): string {
    if (!user.organizationId) {
      throw new ForbiddenException(
        'El usuario no tiene una organizacion asignada; no puede operar sobre el dominio.',
      );
    }
    return user.organizationId;
  }

  /** Lanza 403 si el recurso no pertenece al ambito del usuario. */
  assertOrganizationAccess(user: AuthenticatedUser, organizationId: string | null | undefined): void {
    if (this.hasGlobalScope(user)) return;
    if (!organizationId || organizationId !== user.organizationId) {
      throw new ForbiddenException('El recurso no pertenece a su organizacion.');
    }
  }

  /**
   * Un movimiento es visible para el origen y para el destino: son
   * organizaciones distintas colaborando sobre el mismo evento.
   */
  assertMovementAccess(
    user: AuthenticatedUser,
    originOrganizationId: string | null,
    destinationOrganizationId: string | null,
  ): void {
    if (this.hasGlobalScope(user)) return;
    if (
      originOrganizationId !== user.organizationId &&
      destinationOrganizationId !== user.organizationId
    ) {
      throw new ForbiddenException('El movimiento no involucra a su organizacion.');
    }
  }

  assertCanWrite(user: AuthenticatedUser): void {
    if (this.isReadOnly(user)) {
      throw new ForbiddenException(`El rol ${user.role} es de solo lectura.`);
    }
  }
}
