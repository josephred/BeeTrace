import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { externalSystemEnum, integrationStatusEnum, outboxStatusEnum } from './enums';

/**
 * Historial inmutable de eventos de trazabilidad (arquitectura, seccion 27).
 * Alimenta el timeline de cualquier entidad sin depender de las tablas operativas.
 */
export const traceabilityEvent = pgTable(
  'traceability_event',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventType: varchar('event_type', { length: 80 }).notNull(),
    entityType: varchar('entity_type', { length: 60 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    actorUserId: uuid('actor_user_id'),
    organizationId: uuid('organization_id'),
    correlationId: varchar('correlation_id', { length: 80 }),
    payload: jsonb('payload'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('traceability_event_entity_idx').on(t.entityType, t.entityId, t.occurredAt),
    index('traceability_event_type_idx').on(t.eventType, t.occurredAt),
  ],
);

/** Auditoria independiente de las tablas operativas (arquitectura, seccion 49). */
export const auditEvent = pgTable(
  'audit_event',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    actorUserId: uuid('actor_user_id'),
    actorEmail: varchar('actor_email', { length: 180 }),
    action: varchar('action', { length: 80 }).notNull(),
    entityType: varchar('entity_type', { length: 60 }).notNull(),
    entityId: varchar('entity_id', { length: 80 }),
    before: jsonb('before'),
    after: jsonb('after'),
    source: varchar('source', { length: 40 }).notNull().default('API'),
    correlationId: varchar('correlation_id', { length: 80 }),
    ip: varchar('ip', { length: 60 }),
    userAgent: varchar('user_agent', { length: 300 }),
  },
  (t) => [
    index('audit_event_entity_idx').on(t.entityType, t.entityId),
    index('audit_event_actor_idx').on(t.actorUserId, t.timestamp),
    index('audit_event_timestamp_idx').on(t.timestamp),
  ],
);

/**
 * Outbox transaccional. Sustituye al broker en el MVP sin acoplar el dominio:
 * los servicios publican en la misma transaccion que escriben, y un despachador
 * los entrega. Migrar a RabbitMQ/Kafka no requiere tocar los servicios de dominio.
 */
export const outboxEvent = pgTable(
  'outbox_event',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventType: varchar('event_type', { length: 80 }).notNull(),
    aggregateType: varchar('aggregate_type', { length: 60 }).notNull(),
    aggregateId: varchar('aggregate_id', { length: 80 }).notNull(),
    payload: jsonb('payload').notNull(),
    status: outboxStatusEnum('status').notNull().default('PENDING'),
    attempts: integer('attempts').notNull().default(0),
    availableAt: timestamp('available_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    lastError: varchar('last_error', { length: 1000 }),
    correlationId: varchar('correlation_id', { length: 80 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('outbox_event_dispatch_idx').on(t.status, t.availableAt),
    index('outbox_event_aggregate_idx').on(t.aggregateType, t.aggregateId),
  ],
);

/** Auditoria de comunicaciones con organismos externos (arquitectura, seccion 50). */
export const integrationEvent = pgTable(
  'integration_event',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    system: externalSystemEnum('system').notNull(),
    operation: varchar('operation', { length: 120 }).notNull(),
    requestId: varchar('request_id', { length: 120 }),
    externalId: varchar('external_id', { length: 120 }),
    requestHash: varchar('request_hash', { length: 128 }),
    responseHash: varchar('response_hash', { length: 128 }),
    status: integrationStatusEnum('status').notNull(),
    httpStatus: integer('http_status'),
    latencyMs: integer('latency_ms'),
    errorCode: varchar('error_code', { length: 80 }),
    errorMessage: varchar('error_message', { length: 1000 }),
    correlationId: varchar('correlation_id', { length: 80 }),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('integration_event_system_idx').on(t.system, t.occurredAt),
    index('integration_event_status_idx').on(t.status, t.occurredAt),
  ],
);

/** Idempotencia de comandos (arquitectura, seccion 38). */
export const idempotencyKey = pgTable(
  'idempotency_key',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: varchar('key', { length: 200 }).notNull().unique(),
    userId: uuid('user_id'),
    endpoint: varchar('endpoint', { length: 200 }).notNull(),
    requestHash: varchar('request_hash', { length: 128 }).notNull(),
    responseStatus: integer('response_status'),
    responseBody: jsonb('response_body'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('idempotency_key_expires_idx').on(t.expiresAt)],
);

/**
 * Contador atomico para codigos legibles por humanos (MOV-2026-000123).
 * Un UPSERT con RETURNING garantiza unicidad sin bloqueos de tabla.
 */
export const codeSequence = pgTable(
  'code_sequence',
  {
    prefix: varchar('prefix', { length: 20 }).notNull(),
    year: integer('year').notNull(),
    lastValue: integer('last_value').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.prefix, t.year], name: 'code_sequence_pk' })],
);
