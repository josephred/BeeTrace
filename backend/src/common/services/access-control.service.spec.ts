import { ForbiddenException } from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import type { AuthenticatedUser } from '../types';

const build = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
  id: 'user-1',
  email: 'user@test.local',
  fullName: 'Usuario',
  role: 'PRODUCTOR',
  organizationId: 'org-a',
  ...overrides,
});

describe('AccessControlService', () => {
  const service = new AccessControlService();

  describe('alcance por organizacion', () => {
    it('limita a los roles operativos a su propia organizacion', () => {
      expect(service.organizationScope(build())).toBe('org-a');
    });

    it('da alcance global a ADMIN y AUDITOR', () => {
      expect(service.organizationScope(build({ role: 'ADMIN' }))).toBeNull();
      expect(service.organizationScope(build({ role: 'AUDITOR' }))).toBeNull();
    });

    it('rechaza a un usuario operativo sin organizacion asignada', () => {
      expect(() => service.organizationScope(build({ organizationId: null }))).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('acceso a un recurso', () => {
    it('permite el recurso de la propia organizacion', () => {
      expect(() => service.assertOrganizationAccess(build(), 'org-a')).not.toThrow();
    });

    it('bloquea el recurso de otra organizacion', () => {
      expect(() => service.assertOrganizationAccess(build(), 'org-b')).toThrow(ForbiddenException);
    });

    it('bloquea un recurso sin organizacion para un rol operativo', () => {
      expect(() => service.assertOrganizationAccess(build(), null)).toThrow(ForbiddenException);
    });

    it('no bloquea nada para un rol de alcance global', () => {
      expect(() => service.assertOrganizationAccess(build({ role: 'ADMIN' }), 'org-b')).not.toThrow();
    });
  });

  describe('acceso a un movimiento', () => {
    it('lo hace visible desde el origen', () => {
      expect(() => service.assertMovementAccess(build(), 'org-a', 'org-b')).not.toThrow();
    });

    it('lo hace visible desde el destino', () => {
      expect(() => service.assertMovementAccess(build(), 'org-b', 'org-a')).not.toThrow();
    });

    it('lo oculta a un tercero ajeno al traslado', () => {
      expect(() => service.assertMovementAccess(build(), 'org-b', 'org-c')).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('escritura', () => {
    it('bloquea a los roles de solo lectura', () => {
      expect(() => service.assertCanWrite(build({ role: 'AUDITOR' }))).toThrow(ForbiddenException);
      expect(() => service.assertCanWrite(build({ role: 'CONSULTA' }))).toThrow(ForbiddenException);
    });

    it('permite a los roles operativos', () => {
      expect(() => service.assertCanWrite(build({ role: 'SALA' }))).not.toThrow();
    });
  });
});
