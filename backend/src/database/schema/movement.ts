import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  documentTypeEnum,
  dteStatusEnum,
  establishmentTypeEnum,
  externalSystemEnum,
  materialTypeEnum,
  movementStatusEnum,
  movementTypeEnum,
  receptionResultEnum,
  syncStatusEnum,
  unitOfMeasureEnum,
} from './enums';
import { establishment } from './establishment';
import { apiary } from './apiary';
import { carrier, vehicle } from './transport';

/**
 * Reglas de negocio configurables y versionadas (arquitectura, secciones 71-72).
 * Evita hardcodear la normativa: la vigencia se expresa con effectiveFrom/effectiveTo.
 * Ejemplo real: DT-e obligatorio para material melario apiario -> sala desde 2026-08-01.
 */
export const movementRule = pgTable(
  'movement_rule',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull(),
    movementType: movementTypeEnum('movement_type'),
    materialType: materialTypeEnum('material_type'),
    originType: establishmentTypeEnum('origin_type'),
    destinationType: establishmentTypeEnum('destination_type'),
    requiresDocument: boolean('requires_document').notNull().default(false),
    requiredDocumentType: documentTypeEnum('required_document_type'),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    priority: integer('priority').notNull().default(100),
    active: boolean('active').notNull().default(true),
    legalReference: varchar('legal_reference', { length: 300 }),
    notes: varchar('notes', { length: 1000 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('movement_rule_vigencia_idx').on(t.active, t.effectiveFrom, t.effectiveTo)],
);

/**
 * Movimiento: evento de dominio que conecta un origen y un destino.
 * Regla de modelado 4: el Movimiento NO es el DT-e. El DT-e es un documento asociado.
 */
export const movement = pgTable(
  'movement',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 40 }).notNull().unique(),
    movementType: movementTypeEnum('movement_type').notNull(),
    materialType: materialTypeEnum('material_type').notNull(),
    originEstablishmentId: uuid('origin_establishment_id')
      .notNull()
      .references(() => establishment.id, { onDelete: 'restrict' }),
    originApiaryId: uuid('origin_apiary_id').references(() => apiary.id, { onDelete: 'set null' }),
    destinationEstablishmentId: uuid('destination_establishment_id')
      .notNull()
      .references(() => establishment.id, { onDelete: 'restrict' }),
    carrierId: uuid('carrier_id').references(() => carrier.id, { onDelete: 'set null' }),
    vehicleId: uuid('vehicle_id').references(() => vehicle.id, { onDelete: 'set null' }),
    driverName: varchar('driver_name', { length: 160 }),
    driverDocument: varchar('driver_document', { length: 40 }),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    dispatchedAt: timestamp('dispatched_at', { withTimezone: true }),
    receivedAt: timestamp('received_at', { withTimezone: true }),
    quantity: numeric('quantity', { precision: 14, scale: 3 }).notNull(),
    unit: unitOfMeasureEnum('unit').notNull(),
    status: movementStatusEnum('status').notNull().default('DRAFT'),
    requiresDocument: boolean('requires_document').notNull().default(false),
    requiredDocumentType: documentTypeEnum('required_document_type'),
    appliedRuleId: uuid('applied_rule_id').references(() => movementRule.id, {
      onDelete: 'set null',
    }),
    notes: varchar('notes', { length: 1000 }),
    createdById: uuid('created_by_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('movement_status_scheduled_idx').on(t.status, t.scheduledAt),
    index('movement_origin_idx').on(t.originEstablishmentId),
    index('movement_destination_idx').on(t.destinationEstablishmentId),
    index('movement_origin_apiary_idx').on(t.originApiaryId),
  ],
);

/**
 * DT-e: documento oficial que ampara determinados movimientos, gestionado en SIGSA.
 * Mantiene el par estado interno / estado externo y el estado de sincronizacion,
 * de modo que la plataforma funcione aunque el organismo no responda.
 */
export const dte = pgTable(
  'dte',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    movementId: uuid('movement_id')
      .notNull()
      .unique()
      .references(() => movement.id, { onDelete: 'cascade' }),
    number: varchar('number', { length: 80 }),
    status: dteStatusEnum('status').notNull().default('DRAFT'),
    issuedAt: timestamp('issued_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    originRenspa: varchar('origin_renspa', { length: 60 }),
    destinationRenspa: varchar('destination_renspa', { length: 60 }),
    externalSystem: externalSystemEnum('external_system').notNull().default('SENASA_SIGSA'),
    externalId: varchar('external_id', { length: 120 }),
    externalStatus: varchar('external_status', { length: 80 }),
    syncStatus: syncStatusEnum('sync_status').notNull().default('PENDING_SYNC'),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    errorCode: varchar('error_code', { length: 80 }),
    errorMessage: varchar('error_message', { length: 600 }),
    payload: jsonb('payload'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('dte_status_sync_idx').on(t.status, t.syncStatus), index('dte_number_idx').on(t.number)],
);

export const reception = pgTable(
  'reception',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    movementId: uuid('movement_id')
      .notNull()
      .unique()
      .references(() => movement.id, { onDelete: 'cascade' }),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishment.id, { onDelete: 'restrict' }),
    receivedByUserId: uuid('received_by_user_id'),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
    receivedQuantity: numeric('received_quantity', { precision: 14, scale: 3 }).notNull(),
    unit: unitOfMeasureEnum('unit').notNull(),
    result: receptionResultEnum('result').notNull().default('ACCEPTED'),
    hasDiscrepancy: boolean('has_discrepancy').notNull().default(false),
    discrepancyNotes: varchar('discrepancy_notes', { length: 1000 }),
    notes: varchar('notes', { length: 1000 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('reception_establishment_idx').on(t.establishmentId, t.receivedAt)],
);
