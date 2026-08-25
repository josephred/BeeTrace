import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  documentTypeEnum,
  drumStatusEnum,
  externalSystemEnum,
  extractionStatusEnum,
  inventoryEventTypeEnum,
  lotInputSourceTypeEnum,
  lotStatusEnum,
  lotTypeEnum,
  materialTypeEnum,
  sampleStatusEnum,
  unitOfMeasureEnum,
} from './enums';
import { organization } from './identity';
import { establishment } from './establishment';
import { movement } from './movement';

/** Extraccion: operacion que transforma material melario recibido en miel loteada. */
export const extraction = pgTable(
  'extraction',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 40 }).notNull().unique(),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishment.id, { onDelete: 'restrict' }),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    status: extractionStatusEnum('status').notNull().default('DRAFT'),
    inputQuantity: numeric('input_quantity', { precision: 14, scale: 3 }).notNull(),
    outputQuantity: numeric('output_quantity', { precision: 14, scale: 3 }),
    unit: unitOfMeasureEnum('unit').notNull().default('KG'),
    operatorName: varchar('operator_name', { length: 160 }),
    notes: varchar('notes', { length: 1000 }),
    createdById: uuid('created_by_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('extraction_establishment_idx').on(t.establishmentId, t.startedAt)],
);

/** Entradas de la extraccion: los movimientos recibidos que la alimentan. */
export const extractionInput = pgTable(
  'extraction_input',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    extractionId: uuid('extraction_id')
      .notNull()
      .references(() => extraction.id, { onDelete: 'cascade' }),
    movementId: uuid('movement_id')
      .notNull()
      .references(() => movement.id, { onDelete: 'restrict' }),
    quantity: numeric('quantity', { precision: 14, scale: 3 }).notNull(),
    unit: unitOfMeasureEnum('unit').notNull(),
  },
  (t) => [unique('extraction_input_uq').on(t.extractionId, t.movementId)],
);

/** Lote: unidad logica de trazabilidad. Regla de modelado 5: no es el Tambor. */
export const lot = pgTable(
  'lot',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 60 }).notNull().unique(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'restrict' }),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishment.id, { onDelete: 'restrict' }),
    extractionId: uuid('extraction_id').references(() => extraction.id, { onDelete: 'set null' }),
    lotType: lotTypeEnum('lot_type').notNull().default('EXTRACCION'),
    productionDate: timestamp('production_date', { withTimezone: true }).notNull(),
    quantity: numeric('quantity', { precision: 14, scale: 3 }).notNull(),
    availableQuantity: numeric('available_quantity', { precision: 14, scale: 3 }).notNull(),
    unit: unitOfMeasureEnum('unit').notNull().default('KG'),
    status: lotStatusEnum('status').notNull().default('OPEN'),
    honeyType: varchar('honey_type', { length: 120 }),
    moisturePercent: numeric('moisture_percent', { precision: 5, scale: 2 }),
    color: varchar('color', { length: 60 }),
    notes: varchar('notes', { length: 1000 }),
    createdById: uuid('created_by_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('lot_org_status_idx').on(t.organizationId, t.status),
    index('lot_establishment_date_idx').on(t.establishmentId, t.productionDate),
  ],
);

/**
 * Arista del grafo de trazabilidad: de que se compone un lote.
 * sourceLotId permite encadenar generaciones de lotes (acopio, mezcla,
 * fraccionamiento) y recorrerlas con CTE recursivas en ambos sentidos.
 */
export const lotInput = pgTable(
  'lot_input',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lotId: uuid('lot_id')
      .notNull()
      .references(() => lot.id, { onDelete: 'cascade' }),
    sourceType: lotInputSourceTypeEnum('source_type').notNull(),
    sourceMovementId: uuid('source_movement_id').references(() => movement.id, {
      onDelete: 'restrict',
    }),
    sourceLotId: uuid('source_lot_id').references(() => lot.id, { onDelete: 'restrict' }),
    sourceExtractionId: uuid('source_extraction_id').references(() => extraction.id, {
      onDelete: 'set null',
    }),
    quantity: numeric('quantity', { precision: 14, scale: 3 }).notNull(),
    unit: unitOfMeasureEnum('unit').notNull(),
    notes: varchar('notes', { length: 600 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('lot_input_lot_idx').on(t.lotId),
    index('lot_input_source_lot_idx').on(t.sourceLotId),
    index('lot_input_source_movement_idx').on(t.sourceMovementId),
  ],
);

/** Tambor: unidad fisica asociada a un lote. */
export const drum = pgTable(
  'drum',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 60 }).notNull().unique(),
    lotId: uuid('lot_id')
      .notNull()
      .references(() => lot.id, { onDelete: 'restrict' }),
    locationEstablishmentId: uuid('location_establishment_id').references(() => establishment.id, {
      onDelete: 'set null',
    }),
    tareWeight: numeric('tare_weight', { precision: 10, scale: 3 }),
    grossWeight: numeric('gross_weight', { precision: 10, scale: 3 }),
    netWeight: numeric('net_weight', { precision: 10, scale: 3 }).notNull(),
    unit: unitOfMeasureEnum('unit').notNull().default('KG'),
    status: drumStatusEnum('status').notNull().default('FILLED'),
    sealNumber: varchar('seal_number', { length: 60 }),
    filledAt: timestamp('filled_at', { withTimezone: true }),
    notes: varchar('notes', { length: 600 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('drum_lot_idx').on(t.lotId), index('drum_status_idx').on(t.status)],
);

export const movementItem = pgTable(
  'movement_item',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    movementId: uuid('movement_id')
      .notNull()
      .references(() => movement.id, { onDelete: 'cascade' }),
    materialType: materialTypeEnum('material_type').notNull(),
    description: varchar('description', { length: 300 }),
    quantity: numeric('quantity', { precision: 14, scale: 3 }).notNull(),
    unit: unitOfMeasureEnum('unit').notNull(),
    lotId: uuid('lot_id').references(() => lot.id, { onDelete: 'set null' }),
    drumId: uuid('drum_id').references(() => drum.id, { onDelete: 'set null' }),
  },
  (t) => [index('movement_item_movement_idx').on(t.movementId)],
);

export const inventoryEvent = pgTable(
  'inventory_event',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventType: inventoryEventTypeEnum('event_type').notNull(),
    drumId: uuid('drum_id').references(() => drum.id, { onDelete: 'cascade' }),
    lotId: uuid('lot_id').references(() => lot.id, { onDelete: 'cascade' }),
    fromEstablishmentId: uuid('from_establishment_id').references(() => establishment.id, {
      onDelete: 'set null',
    }),
    toEstablishmentId: uuid('to_establishment_id').references(() => establishment.id, {
      onDelete: 'set null',
    }),
    quantity: numeric('quantity', { precision: 14, scale: 3 }),
    unit: unitOfMeasureEnum('unit'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    actorUserId: uuid('actor_user_id'),
    notes: varchar('notes', { length: 600 }),
  },
  (t) => [
    index('inventory_event_drum_idx').on(t.drumId, t.occurredAt),
    index('inventory_event_lot_idx').on(t.lotId, t.occurredAt),
  ],
);

export const sample = pgTable(
  'sample',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 60 }).notNull().unique(),
    lotId: uuid('lot_id')
      .notNull()
      .references(() => lot.id, { onDelete: 'cascade' }),
    drumId: uuid('drum_id').references(() => drum.id, { onDelete: 'set null' }),
    laboratoryOrganizationId: uuid('laboratory_organization_id').references(() => organization.id, {
      onDelete: 'set null',
    }),
    takenAt: timestamp('taken_at', { withTimezone: true }).notNull(),
    takenBy: varchar('taken_by', { length: 160 }),
    analysisType: varchar('analysis_type', { length: 160 }),
    status: sampleStatusEnum('status').notNull().default('CREATED'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    notes: varchar('notes', { length: 1000 }),
    createdById: uuid('created_by_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sample_lot_status_idx').on(t.lotId, t.status)],
);

/** Metadatos de archivos. El binario vive en object storage, no en PostgreSQL. */
export const document = pgTable(
  'document',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: documentTypeEnum('type').notNull(),
    number: varchar('number', { length: 120 }),
    movementId: uuid('movement_id').references(() => movement.id, { onDelete: 'cascade' }),
    lotId: uuid('lot_id').references(() => lot.id, { onDelete: 'cascade' }),
    sampleId: uuid('sample_id').references(() => sample.id, { onDelete: 'cascade' }),
    issuedAt: timestamp('issued_at', { withTimezone: true }),
    objectKey: varchar('object_key', { length: 400 }),
    mimeType: varchar('mime_type', { length: 120 }),
    hash: varchar('hash', { length: 128 }),
    sizeBytes: integer('size_bytes'),
    externalSystem: externalSystemEnum('external_system').notNull().default('MANUAL'),
    externalId: varchar('external_id', { length: 120 }),
    metadata: jsonb('metadata'),
    createdById: uuid('created_by_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('document_type_idx').on(t.type),
    index('document_movement_idx').on(t.movementId),
    index('document_lot_idx').on(t.lotId),
  ],
);
