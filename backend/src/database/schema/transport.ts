import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { entityStatusEnum } from './enums';
import { organization } from './identity';

export const carrier = pgTable('carrier', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organization.id, {
    onDelete: 'set null',
  }),
  businessName: varchar('business_name', { length: 200 }).notNull(),
  taxId: varchar('tax_id', { length: 20 }).unique(),
  licenseNumber: varchar('license_number', { length: 80 }),
  contactName: varchar('contact_name', { length: 160 }),
  phone: varchar('phone', { length: 40 }),
  status: entityStatusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const vehicle = pgTable('vehicle', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id')
    .notNull()
    .references(() => carrier.id, { onDelete: 'cascade' }),
  plate: varchar('plate', { length: 20 }).notNull().unique(),
  trailerPlate: varchar('trailer_plate', { length: 20 }),
  type: varchar('type', { length: 60 }),
  status: entityStatusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
