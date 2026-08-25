import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../database/database.module';
import { organization, user } from '../../database/schema';
import { AuditService } from '../../common/services/audit.service';
import type { AuthenticatedUser } from '../../common/types';
import type { PaginationQueryDto } from '../../common/dto/pagination.dto';
import type { CreateOrganizationDto, UpdateUserRoleDto } from './dto/auth.dto';

const publicUserColumns = {
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
  status: user.status,
  organizationId: user.organizationId,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
};

@Injectable()
export class IdentityService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly audit: AuditService,
  ) {}

  async listUsers(query: PaginationQueryDto) {
    const where: SQL | undefined = query.q
      ? or(ilike(user.email, `%${query.q}%`), ilike(user.fullName, `%${query.q}%`))
      : undefined;

    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select(publicUserColumns)
        .from(user)
        .where(where)
        .orderBy(asc(user.email))
        .limit(query.pageSize)
        .offset(query.offset),
      this.db.select({ count: sql<number>`cast(count(*) as int)` }).from(user).where(where),
    ]);
    return { rows, total: count };
  }

  async getUser(id: string) {
    const rows = await this.db.select(publicUserColumns).from(user).where(eq(user.id, id)).limit(1);
    if (rows.length === 0) throw new NotFoundException('Usuario no encontrado.');
    return rows[0];
  }

  /** CU-03: administrar roles, organizacion y estado de un usuario. */
  async updateUser(id: string, dto: UpdateUserRoleDto, actor: AuthenticatedUser) {
    const before = await this.getUser(id);

    if (dto.organizationId) {
      const org = await this.db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.id, dto.organizationId))
        .limit(1);
      if (org.length === 0) throw new NotFoundException('La organizacion indicada no existe.');
    }

    const [updated] = await this.db
      .update(user)
      .set({
        role: dto.role,
        organizationId: dto.organizationId ?? before.organizationId,
        status: dto.status ?? before.status,
        updatedAt: new Date(),
      })
      .where(eq(user.id, id))
      .returning(publicUserColumns);

    await this.audit.record({
      action: 'USER_ROLE_UPDATED',
      entityType: 'user',
      entityId: id,
      actor,
      before,
      after: updated,
    });

    return updated;
  }

  async listOrganizations(query: PaginationQueryDto) {
    const where: SQL | undefined = query.q ? ilike(organization.name, `%${query.q}%`) : undefined;
    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select()
        .from(organization)
        .where(where)
        .orderBy(asc(organization.name))
        .limit(query.pageSize)
        .offset(query.offset),
      this.db.select({ count: sql<number>`cast(count(*) as int)` }).from(organization).where(where),
    ]);
    return { rows, total: count };
  }

  async createOrganization(dto: CreateOrganizationDto, actor: AuthenticatedUser) {
    if (dto.taxId) {
      const existing = await this.db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.taxId, dto.taxId))
        .limit(1);
      if (existing.length > 0) {
        throw new ConflictException('Ya existe una organizacion con ese CUIT.');
      }
    }

    const [created] = await this.db.insert(organization).values(dto).returning();
    await this.audit.record({
      action: 'ORGANIZATION_CREATED',
      entityType: 'organization',
      entityId: created.id,
      actor,
      after: created,
    });
    return created;
  }

  async getOrganization(id: string) {
    const rows = await this.db
      .select()
      .from(organization)
      .where(eq(organization.id, id))
      .limit(1);
    if (rows.length === 0) throw new NotFoundException('Organizacion no encontrada.');
    return rows[0];
  }
}
