export type UserRoleName =
  | 'ADMIN'
  | 'PRODUCTOR'
  | 'SALA'
  | 'TRANSPORTISTA'
  | 'ACOPIADOR'
  | 'FRACCIONADOR'
  | 'LABORATORIO'
  | 'EXPORTADOR'
  | 'AUDITOR'
  | 'CONSULTA';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRoleName;
  organizationId: string | null;
}

export interface RequestContext {
  user?: AuthenticatedUser;
  correlationId: string;
  ip?: string;
  userAgent?: string;
}

/** Roles con visibilidad transversal a todas las organizaciones. */
export const GLOBAL_SCOPE_ROLES: UserRoleName[] = ['ADMIN', 'AUDITOR'];

/** Roles sin capacidad de escritura sobre el dominio. */
export const READ_ONLY_ROLES: UserRoleName[] = ['AUDITOR', 'CONSULTA'];
