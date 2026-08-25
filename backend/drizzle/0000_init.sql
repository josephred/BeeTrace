CREATE TYPE "public"."document_type" AS ENUM('DTE', 'REMITO', 'FACTURA', 'CERTIFICADO_ANALISIS', 'CERTIFICADO_ORIGEN', 'FOTO', 'OTRO');--> statement-breakpoint
CREATE TYPE "public"."drum_status" AS ENUM('EMPTY', 'FILLED', 'IN_STOCK', 'IN_TRANSIT', 'DISPATCHED', 'CONSUMED');--> statement-breakpoint
CREATE TYPE "public"."dte_status" AS ENUM('DRAFT', 'ISSUED', 'APPROVED', 'CLOSED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."entity_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."establishment_type" AS ENUM('APIARIO_BASE', 'SALA_EXTRACCION', 'ACOPIO', 'FRACCIONADORA', 'DEPOSITO', 'LABORATORIO', 'OTRO');--> statement-breakpoint
CREATE TYPE "public"."external_system" AS ENUM('MANUAL', 'SENASA_SIGSA', 'SENASA_RENSPA', 'SENASA_RENAPA', 'ARCA', 'SIFEGA', 'LABORATORIO');--> statement-breakpoint
CREATE TYPE "public"."extraction_status" AS ENUM('DRAFT', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."integration_status" AS ENUM('SUCCESS', 'ERROR', 'TIMEOUT', 'SKIPPED');--> statement-breakpoint
CREATE TYPE "public"."inventory_event_type" AS ENUM('CREATED', 'MOVED', 'DISPATCHED', 'RECEIVED', 'CONSUMED', 'ADJUSTED', 'BLOCKED', 'RELEASED');--> statement-breakpoint
CREATE TYPE "public"."lot_input_source_type" AS ENUM('MOVEMENT', 'LOT', 'EXTRACTION', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."lot_status" AS ENUM('OPEN', 'CLOSED', 'BLOCKED', 'DISPATCHED', 'CONSUMED');--> statement-breakpoint
CREATE TYPE "public"."lot_type" AS ENUM('EXTRACCION', 'ACOPIO', 'MEZCLA', 'FRACCIONAMIENTO');--> statement-breakpoint
CREATE TYPE "public"."material_type" AS ENUM('MATERIAL_MELARIO', 'MIEL', 'CERA', 'POLEN', 'PROPOLEO', 'JALEA_REAL', 'NUCLEO', 'COLMENA', 'OTRO');--> statement-breakpoint
CREATE TYPE "public"."movement_status" AS ENUM('DRAFT', 'DISPATCHED', 'IN_TRANSIT', 'RECEIVED', 'PARTIALLY_RECEIVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."movement_type" AS ENUM('MATERIAL_MELARIO', 'MIEL_A_GRANEL', 'PRODUCTO_FRACCIONADO', 'MATERIAL_VIVO', 'MATERIAL_INERTE', 'OTRO');--> statement-breakpoint
CREATE TYPE "public"."organization_type" AS ENUM('PRODUCTOR', 'SALA_EXTRACCION', 'ACOPIO', 'FRACCIONADOR', 'LABORATORIO', 'TRANSPORTE', 'EXPORTADOR', 'ADMINISTRACION');--> statement-breakpoint
CREATE TYPE "public"."outbox_status" AS ENUM('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."person_type" AS ENUM('FISICA', 'JURIDICA');--> statement-breakpoint
CREATE TYPE "public"."reception_result" AS ENUM('ACCEPTED', 'PARTIAL', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."sample_status" AS ENUM('CREATED', 'SENT', 'IN_ANALYSIS', 'RESULT_LOADED', 'CLOSED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('NOT_APPLICABLE', 'PENDING_SYNC', 'SYNCHRONIZED', 'ERROR');--> statement-breakpoint
CREATE TYPE "public"."unit_of_measure" AS ENUM('KG', 'LITRO', 'ALZA', 'TAMBOR', 'COLMENA', 'UNIDAD');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'PRODUCTOR', 'SALA', 'TRANSPORTISTA', 'ACOPIADOR', 'FRACCIONADOR', 'LABORATORIO', 'EXPORTADOR', 'AUDITOR', 'CONSULTA');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'DISABLED');--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"legal_name" varchar(200),
	"tax_id" varchar(20),
	"type" "organization_type" NOT NULL,
	"status" "entity_status" DEFAULT 'ACTIVE' NOT NULL,
	"email" varchar(180),
	"phone" varchar(40),
	"address" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_tax_id_unique" UNIQUE("tax_id")
);
--> statement-breakpoint
CREATE TABLE "refresh_token" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"user_agent" varchar(300),
	"ip" varchar(60),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_token_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "app_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(180) NOT NULL,
	"password_hash" varchar(120) NOT NULL,
	"full_name" varchar(160) NOT NULL,
	"role" "user_role" DEFAULT 'CONSULTA' NOT NULL,
	"status" "user_status" DEFAULT 'PENDING' NOT NULL,
	"organization_id" uuid,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "producer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"business_name" varchar(200) NOT NULL,
	"person_type" "person_type" DEFAULT 'FISICA' NOT NULL,
	"tax_id" varchar(20),
	"status" "entity_status" DEFAULT 'ACTIVE' NOT NULL,
	"email" varchar(180),
	"phone" varchar(40),
	"address" varchar(300),
	"province" varchar(100),
	"locality" varchar(120),
	"notes" varchar(1000),
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "producer_tax_id_unique" UNIQUE("tax_id")
);
--> statement-breakpoint
CREATE TABLE "renapa_registration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"producer_id" uuid NOT NULL,
	"number" varchar(60) NOT NULL,
	"status" "registration_status" DEFAULT 'PENDING_VERIFICATION' NOT NULL,
	"issued_at" timestamp with time zone,
	"external_system" "external_system" DEFAULT 'MANUAL' NOT NULL,
	"external_id" varchar(120),
	"sync_status" "sync_status" DEFAULT 'NOT_APPLICABLE' NOT NULL,
	"last_sync_at" timestamp with time zone,
	"source_note" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "renapa_registration_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "establishment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"producer_id" uuid,
	"name" varchar(200) NOT NULL,
	"type" "establishment_type" NOT NULL,
	"address" varchar(300),
	"locality" varchar(120),
	"province" varchar(100),
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"status" "entity_status" DEFAULT 'ACTIVE' NOT NULL,
	"rne" varchar(60),
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "renspa_registration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"establishment_id" uuid NOT NULL,
	"producer_id" uuid NOT NULL,
	"number" varchar(60) NOT NULL,
	"activity" varchar(120),
	"status" "registration_status" DEFAULT 'PENDING_VERIFICATION' NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_to" timestamp with time zone,
	"external_system" "external_system" DEFAULT 'MANUAL' NOT NULL,
	"external_id" varchar(120),
	"sync_status" "sync_status" DEFAULT 'NOT_APPLICABLE' NOT NULL,
	"last_sync_at" timestamp with time zone,
	"source_note" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "renspa_registration_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "apiary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"establishment_id" uuid NOT NULL,
	"code" varchar(60) NOT NULL,
	"name" varchar(160),
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"locality" varchar(120),
	"province" varchar(100),
	"hive_count" integer DEFAULT 0 NOT NULL,
	"status" "entity_status" DEFAULT 'ACTIVE' NOT NULL,
	"registered_at" timestamp with time zone,
	"notes" varchar(1000),
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "apiary_establishment_code_uq" UNIQUE("establishment_id","code")
);
--> statement-breakpoint
CREATE TABLE "hive" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"apiary_id" uuid NOT NULL,
	"code" varchar(60) NOT NULL,
	"identifier" varchar(120),
	"type" varchar(60),
	"status" "entity_status" DEFAULT 'ACTIVE' NOT NULL,
	"installed_at" timestamp with time zone,
	"notes" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hive_apiary_code_uq" UNIQUE("apiary_id","code")
);
--> statement-breakpoint
CREATE TABLE "carrier" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"business_name" varchar(200) NOT NULL,
	"tax_id" varchar(20),
	"license_number" varchar(80),
	"contact_name" varchar(160),
	"phone" varchar(40),
	"status" "entity_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "carrier_tax_id_unique" UNIQUE("tax_id")
);
--> statement-breakpoint
CREATE TABLE "vehicle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"carrier_id" uuid NOT NULL,
	"plate" varchar(20) NOT NULL,
	"trailer_plate" varchar(20),
	"type" varchar(60),
	"status" "entity_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicle_plate_unique" UNIQUE("plate")
);
--> statement-breakpoint
CREATE TABLE "dte" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"movement_id" uuid NOT NULL,
	"number" varchar(80),
	"status" "dte_status" DEFAULT 'DRAFT' NOT NULL,
	"issued_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"origin_renspa" varchar(60),
	"destination_renspa" varchar(60),
	"external_system" "external_system" DEFAULT 'SENASA_SIGSA' NOT NULL,
	"external_id" varchar(120),
	"external_status" varchar(80),
	"sync_status" "sync_status" DEFAULT 'PENDING_SYNC' NOT NULL,
	"last_sync_at" timestamp with time zone,
	"error_code" varchar(80),
	"error_message" varchar(600),
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dte_movement_id_unique" UNIQUE("movement_id")
);
--> statement-breakpoint
CREATE TABLE "movement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(40) NOT NULL,
	"movement_type" "movement_type" NOT NULL,
	"material_type" "material_type" NOT NULL,
	"origin_establishment_id" uuid NOT NULL,
	"origin_apiary_id" uuid,
	"destination_establishment_id" uuid NOT NULL,
	"carrier_id" uuid,
	"vehicle_id" uuid,
	"driver_name" varchar(160),
	"driver_document" varchar(40),
	"scheduled_at" timestamp with time zone NOT NULL,
	"dispatched_at" timestamp with time zone,
	"received_at" timestamp with time zone,
	"quantity" numeric(14, 3) NOT NULL,
	"unit" "unit_of_measure" NOT NULL,
	"status" "movement_status" DEFAULT 'DRAFT' NOT NULL,
	"requires_document" boolean DEFAULT false NOT NULL,
	"required_document_type" "document_type",
	"applied_rule_id" uuid,
	"notes" varchar(1000),
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "movement_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "movement_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"movement_type" "movement_type",
	"material_type" "material_type",
	"origin_type" "establishment_type",
	"destination_type" "establishment_type",
	"requires_document" boolean DEFAULT false NOT NULL,
	"required_document_type" "document_type",
	"effective_from" timestamp with time zone NOT NULL,
	"effective_to" timestamp with time zone,
	"priority" integer DEFAULT 100 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"legal_reference" varchar(300),
	"notes" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reception" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"movement_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"received_by_user_id" uuid,
	"received_at" timestamp with time zone NOT NULL,
	"received_quantity" numeric(14, 3) NOT NULL,
	"unit" "unit_of_measure" NOT NULL,
	"result" "reception_result" DEFAULT 'ACCEPTED' NOT NULL,
	"has_discrepancy" boolean DEFAULT false NOT NULL,
	"discrepancy_notes" varchar(1000),
	"notes" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reception_movement_id_unique" UNIQUE("movement_id")
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "document_type" NOT NULL,
	"number" varchar(120),
	"movement_id" uuid,
	"lot_id" uuid,
	"sample_id" uuid,
	"issued_at" timestamp with time zone,
	"object_key" varchar(400),
	"mime_type" varchar(120),
	"hash" varchar(128),
	"size_bytes" integer,
	"external_system" "external_system" DEFAULT 'MANUAL' NOT NULL,
	"external_id" varchar(120),
	"metadata" jsonb,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drum" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(60) NOT NULL,
	"lot_id" uuid NOT NULL,
	"location_establishment_id" uuid,
	"tare_weight" numeric(10, 3),
	"gross_weight" numeric(10, 3),
	"net_weight" numeric(10, 3) NOT NULL,
	"unit" "unit_of_measure" DEFAULT 'KG' NOT NULL,
	"status" "drum_status" DEFAULT 'FILLED' NOT NULL,
	"seal_number" varchar(60),
	"filled_at" timestamp with time zone,
	"notes" varchar(600),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "drum_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "extraction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(40) NOT NULL,
	"establishment_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"status" "extraction_status" DEFAULT 'DRAFT' NOT NULL,
	"input_quantity" numeric(14, 3) NOT NULL,
	"output_quantity" numeric(14, 3),
	"unit" "unit_of_measure" DEFAULT 'KG' NOT NULL,
	"operator_name" varchar(160),
	"notes" varchar(1000),
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "extraction_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "extraction_input" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"extraction_id" uuid NOT NULL,
	"movement_id" uuid NOT NULL,
	"quantity" numeric(14, 3) NOT NULL,
	"unit" "unit_of_measure" NOT NULL,
	CONSTRAINT "extraction_input_uq" UNIQUE("extraction_id","movement_id")
);
--> statement-breakpoint
CREATE TABLE "inventory_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" "inventory_event_type" NOT NULL,
	"drum_id" uuid,
	"lot_id" uuid,
	"from_establishment_id" uuid,
	"to_establishment_id" uuid,
	"quantity" numeric(14, 3),
	"unit" "unit_of_measure",
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" uuid,
	"notes" varchar(600)
);
--> statement-breakpoint
CREATE TABLE "lot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(60) NOT NULL,
	"organization_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"extraction_id" uuid,
	"lot_type" "lot_type" DEFAULT 'EXTRACCION' NOT NULL,
	"production_date" timestamp with time zone NOT NULL,
	"quantity" numeric(14, 3) NOT NULL,
	"available_quantity" numeric(14, 3) NOT NULL,
	"unit" "unit_of_measure" DEFAULT 'KG' NOT NULL,
	"status" "lot_status" DEFAULT 'OPEN' NOT NULL,
	"honey_type" varchar(120),
	"moisture_percent" numeric(5, 2),
	"color" varchar(60),
	"notes" varchar(1000),
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lot_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "lot_input" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lot_id" uuid NOT NULL,
	"source_type" "lot_input_source_type" NOT NULL,
	"source_movement_id" uuid,
	"source_lot_id" uuid,
	"source_extraction_id" uuid,
	"quantity" numeric(14, 3) NOT NULL,
	"unit" "unit_of_measure" NOT NULL,
	"notes" varchar(600),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movement_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"movement_id" uuid NOT NULL,
	"material_type" "material_type" NOT NULL,
	"description" varchar(300),
	"quantity" numeric(14, 3) NOT NULL,
	"unit" "unit_of_measure" NOT NULL,
	"lot_id" uuid,
	"drum_id" uuid
);
--> statement-breakpoint
CREATE TABLE "sample" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(60) NOT NULL,
	"lot_id" uuid NOT NULL,
	"drum_id" uuid,
	"laboratory_organization_id" uuid,
	"taken_at" timestamp with time zone NOT NULL,
	"taken_by" varchar(160),
	"analysis_type" varchar(160),
	"status" "sample_status" DEFAULT 'CREATED' NOT NULL,
	"sent_at" timestamp with time zone,
	"notes" varchar(1000),
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sample_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "audit_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" uuid,
	"actor_email" varchar(180),
	"action" varchar(80) NOT NULL,
	"entity_type" varchar(60) NOT NULL,
	"entity_id" varchar(80),
	"before" jsonb,
	"after" jsonb,
	"source" varchar(40) DEFAULT 'API' NOT NULL,
	"correlation_id" varchar(80),
	"ip" varchar(60),
	"user_agent" varchar(300)
);
--> statement-breakpoint
CREATE TABLE "code_sequence" (
	"prefix" varchar(20) NOT NULL,
	"year" integer NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "code_sequence_pk" PRIMARY KEY("prefix","year")
);
--> statement-breakpoint
CREATE TABLE "idempotency_key" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(200) NOT NULL,
	"user_id" uuid,
	"endpoint" varchar(200) NOT NULL,
	"request_hash" varchar(128) NOT NULL,
	"response_status" integer,
	"response_body" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "idempotency_key_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "integration_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"system" "external_system" NOT NULL,
	"operation" varchar(120) NOT NULL,
	"request_id" varchar(120),
	"external_id" varchar(120),
	"request_hash" varchar(128),
	"response_hash" varchar(128),
	"status" "integration_status" NOT NULL,
	"http_status" integer,
	"latency_ms" integer,
	"error_code" varchar(80),
	"error_message" varchar(1000),
	"correlation_id" varchar(80),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(80) NOT NULL,
	"aggregate_type" varchar(60) NOT NULL,
	"aggregate_id" varchar(80) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "outbox_status" DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"last_error" varchar(1000),
	"correlation_id" varchar(80),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traceability_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(80) NOT NULL,
	"entity_type" varchar(60) NOT NULL,
	"entity_id" uuid NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" uuid,
	"organization_id" uuid,
	"correlation_id" varchar(80),
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producer" ADD CONSTRAINT "producer_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "renapa_registration" ADD CONSTRAINT "renapa_registration_producer_id_producer_id_fk" FOREIGN KEY ("producer_id") REFERENCES "public"."producer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "establishment" ADD CONSTRAINT "establishment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "establishment" ADD CONSTRAINT "establishment_producer_id_producer_id_fk" FOREIGN KEY ("producer_id") REFERENCES "public"."producer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "renspa_registration" ADD CONSTRAINT "renspa_registration_establishment_id_establishment_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "renspa_registration" ADD CONSTRAINT "renspa_registration_producer_id_producer_id_fk" FOREIGN KEY ("producer_id") REFERENCES "public"."producer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apiary" ADD CONSTRAINT "apiary_establishment_id_establishment_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hive" ADD CONSTRAINT "hive_apiary_id_apiary_id_fk" FOREIGN KEY ("apiary_id") REFERENCES "public"."apiary"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carrier" ADD CONSTRAINT "carrier_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_carrier_id_carrier_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."carrier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dte" ADD CONSTRAINT "dte_movement_id_movement_id_fk" FOREIGN KEY ("movement_id") REFERENCES "public"."movement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movement" ADD CONSTRAINT "movement_origin_establishment_id_establishment_id_fk" FOREIGN KEY ("origin_establishment_id") REFERENCES "public"."establishment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movement" ADD CONSTRAINT "movement_origin_apiary_id_apiary_id_fk" FOREIGN KEY ("origin_apiary_id") REFERENCES "public"."apiary"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movement" ADD CONSTRAINT "movement_destination_establishment_id_establishment_id_fk" FOREIGN KEY ("destination_establishment_id") REFERENCES "public"."establishment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movement" ADD CONSTRAINT "movement_carrier_id_carrier_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."carrier"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movement" ADD CONSTRAINT "movement_vehicle_id_vehicle_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicle"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movement" ADD CONSTRAINT "movement_applied_rule_id_movement_rule_id_fk" FOREIGN KEY ("applied_rule_id") REFERENCES "public"."movement_rule"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reception" ADD CONSTRAINT "reception_movement_id_movement_id_fk" FOREIGN KEY ("movement_id") REFERENCES "public"."movement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reception" ADD CONSTRAINT "reception_establishment_id_establishment_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_movement_id_movement_id_fk" FOREIGN KEY ("movement_id") REFERENCES "public"."movement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_lot_id_lot_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lot"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_sample_id_sample_id_fk" FOREIGN KEY ("sample_id") REFERENCES "public"."sample"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drum" ADD CONSTRAINT "drum_lot_id_lot_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lot"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drum" ADD CONSTRAINT "drum_location_establishment_id_establishment_id_fk" FOREIGN KEY ("location_establishment_id") REFERENCES "public"."establishment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extraction" ADD CONSTRAINT "extraction_establishment_id_establishment_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extraction_input" ADD CONSTRAINT "extraction_input_extraction_id_extraction_id_fk" FOREIGN KEY ("extraction_id") REFERENCES "public"."extraction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extraction_input" ADD CONSTRAINT "extraction_input_movement_id_movement_id_fk" FOREIGN KEY ("movement_id") REFERENCES "public"."movement"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_event" ADD CONSTRAINT "inventory_event_drum_id_drum_id_fk" FOREIGN KEY ("drum_id") REFERENCES "public"."drum"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_event" ADD CONSTRAINT "inventory_event_lot_id_lot_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lot"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_event" ADD CONSTRAINT "inventory_event_from_establishment_id_establishment_id_fk" FOREIGN KEY ("from_establishment_id") REFERENCES "public"."establishment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_event" ADD CONSTRAINT "inventory_event_to_establishment_id_establishment_id_fk" FOREIGN KEY ("to_establishment_id") REFERENCES "public"."establishment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lot" ADD CONSTRAINT "lot_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lot" ADD CONSTRAINT "lot_establishment_id_establishment_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lot" ADD CONSTRAINT "lot_extraction_id_extraction_id_fk" FOREIGN KEY ("extraction_id") REFERENCES "public"."extraction"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lot_input" ADD CONSTRAINT "lot_input_lot_id_lot_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lot"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lot_input" ADD CONSTRAINT "lot_input_source_movement_id_movement_id_fk" FOREIGN KEY ("source_movement_id") REFERENCES "public"."movement"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lot_input" ADD CONSTRAINT "lot_input_source_lot_id_lot_id_fk" FOREIGN KEY ("source_lot_id") REFERENCES "public"."lot"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lot_input" ADD CONSTRAINT "lot_input_source_extraction_id_extraction_id_fk" FOREIGN KEY ("source_extraction_id") REFERENCES "public"."extraction"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movement_item" ADD CONSTRAINT "movement_item_movement_id_movement_id_fk" FOREIGN KEY ("movement_id") REFERENCES "public"."movement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movement_item" ADD CONSTRAINT "movement_item_lot_id_lot_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lot"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movement_item" ADD CONSTRAINT "movement_item_drum_id_drum_id_fk" FOREIGN KEY ("drum_id") REFERENCES "public"."drum"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sample" ADD CONSTRAINT "sample_lot_id_lot_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lot"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sample" ADD CONSTRAINT "sample_drum_id_drum_id_fk" FOREIGN KEY ("drum_id") REFERENCES "public"."drum"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sample" ADD CONSTRAINT "sample_laboratory_organization_id_organization_id_fk" FOREIGN KEY ("laboratory_organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organization_type_status_idx" ON "organization" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "refresh_token_user_idx" ON "refresh_token" USING btree ("user_id","revoked_at");--> statement-breakpoint
CREATE INDEX "app_user_organization_idx" ON "app_user" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "app_user_role_status_idx" ON "app_user" USING btree ("role","status");--> statement-breakpoint
CREATE INDEX "producer_org_status_idx" ON "producer" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "renapa_producer_status_idx" ON "renapa_registration" USING btree ("producer_id","status");--> statement-breakpoint
CREATE INDEX "establishment_org_status_idx" ON "establishment" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "establishment_type_status_idx" ON "establishment" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "renspa_establishment_status_idx" ON "renspa_registration" USING btree ("establishment_id","status");--> statement-breakpoint
CREATE INDEX "renspa_producer_idx" ON "renspa_registration" USING btree ("producer_id");--> statement-breakpoint
CREATE INDEX "apiary_status_idx" ON "apiary" USING btree ("status");--> statement-breakpoint
CREATE INDEX "dte_status_sync_idx" ON "dte" USING btree ("status","sync_status");--> statement-breakpoint
CREATE INDEX "dte_number_idx" ON "dte" USING btree ("number");--> statement-breakpoint
CREATE INDEX "movement_status_scheduled_idx" ON "movement" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX "movement_origin_idx" ON "movement" USING btree ("origin_establishment_id");--> statement-breakpoint
CREATE INDEX "movement_destination_idx" ON "movement" USING btree ("destination_establishment_id");--> statement-breakpoint
CREATE INDEX "movement_origin_apiary_idx" ON "movement" USING btree ("origin_apiary_id");--> statement-breakpoint
CREATE INDEX "movement_rule_vigencia_idx" ON "movement_rule" USING btree ("active","effective_from","effective_to");--> statement-breakpoint
CREATE INDEX "reception_establishment_idx" ON "reception" USING btree ("establishment_id","received_at");--> statement-breakpoint
CREATE INDEX "document_type_idx" ON "document" USING btree ("type");--> statement-breakpoint
CREATE INDEX "document_movement_idx" ON "document" USING btree ("movement_id");--> statement-breakpoint
CREATE INDEX "document_lot_idx" ON "document" USING btree ("lot_id");--> statement-breakpoint
CREATE INDEX "drum_lot_idx" ON "drum" USING btree ("lot_id");--> statement-breakpoint
CREATE INDEX "drum_status_idx" ON "drum" USING btree ("status");--> statement-breakpoint
CREATE INDEX "extraction_establishment_idx" ON "extraction" USING btree ("establishment_id","started_at");--> statement-breakpoint
CREATE INDEX "inventory_event_drum_idx" ON "inventory_event" USING btree ("drum_id","occurred_at");--> statement-breakpoint
CREATE INDEX "inventory_event_lot_idx" ON "inventory_event" USING btree ("lot_id","occurred_at");--> statement-breakpoint
CREATE INDEX "lot_org_status_idx" ON "lot" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "lot_establishment_date_idx" ON "lot" USING btree ("establishment_id","production_date");--> statement-breakpoint
CREATE INDEX "lot_input_lot_idx" ON "lot_input" USING btree ("lot_id");--> statement-breakpoint
CREATE INDEX "lot_input_source_lot_idx" ON "lot_input" USING btree ("source_lot_id");--> statement-breakpoint
CREATE INDEX "lot_input_source_movement_idx" ON "lot_input" USING btree ("source_movement_id");--> statement-breakpoint
CREATE INDEX "movement_item_movement_idx" ON "movement_item" USING btree ("movement_id");--> statement-breakpoint
CREATE INDEX "sample_lot_status_idx" ON "sample" USING btree ("lot_id","status");--> statement-breakpoint
CREATE INDEX "audit_event_entity_idx" ON "audit_event" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_event_actor_idx" ON "audit_event" USING btree ("actor_user_id","timestamp");--> statement-breakpoint
CREATE INDEX "audit_event_timestamp_idx" ON "audit_event" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idempotency_key_expires_idx" ON "idempotency_key" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "integration_event_system_idx" ON "integration_event" USING btree ("system","occurred_at");--> statement-breakpoint
CREATE INDEX "integration_event_status_idx" ON "integration_event" USING btree ("status","occurred_at");--> statement-breakpoint
CREATE INDEX "outbox_event_dispatch_idx" ON "outbox_event" USING btree ("status","available_at");--> statement-breakpoint
CREATE INDEX "outbox_event_aggregate_idx" ON "outbox_event" USING btree ("aggregate_type","aggregate_id");--> statement-breakpoint
CREATE INDEX "traceability_event_entity_idx" ON "traceability_event" USING btree ("entity_type","entity_id","occurred_at");--> statement-breakpoint
CREATE INDEX "traceability_event_type_idx" ON "traceability_event" USING btree ("event_type","occurred_at");