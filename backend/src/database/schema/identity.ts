import { index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import {
  entityStatusEnum,
  organizationTypeEnum,
  userRoleEnum,
  userStatusEnum,
} from './enums';

/**
 * Tenant de la plataforma. Habilita la autorizacion contextual descrita en la
 * arquitectura (secciones 47-48): un usuario solo alcanza los datos de su
 * organizacion, salvo los roles ADMIN y AUDITOR.
 */
export const organization = pgTable(
  'organization',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull(),
    legalName: varchar('legal_name', { length: 200 }),
    taxId: varchar('tax_id', { length: 20 }).unique(),
    type: organizationTypeEnum('type').notNull(),
    status: entityStatusEnum('status').notNull().default('ACTIVE'),
    email: varchar('email', { length: 180 }),
    phone: varchar('phone', { length: 40 }),
    address: varchar('address', { length: 300 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('organization_type_status_idx').on(t.type, t.status)],
);

export const user = pgTable(
  'app_user',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 180 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 120 }).notNull(),
    fullName: varchar('full_name', { length: 160 }).notNull(),
    role: userRoleEnum('role').notNull().default('CONSULTA'),
    status: userStatusEnum('status').notNull().default('PENDING'),
    organizationId: uuid('organization_id').references(() => organization.id, {
      onDelete: 'set null',
    }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('app_user_organization_idx').on(t.organizationId),
    index('app_user_role_status_idx').on(t.role, t.status),
  ],
);

export const refreshToken = pgTable(
  'refresh_token',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 128 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    userAgent: varchar('user_agent', { length: 300 }),
    ip: varchar('ip', { length: 60 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('refresh_token_user_idx').on(t.userId, t.revokedAt)],
);
