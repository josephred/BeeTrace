/** Tipos del contrato de la API. Reflejan el OpenAPI del backend. */

export type UserRole =
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

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  tokenType: 'Bearer';
  user: AuthUser;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface Organization {
  id: string;
  name: string;
  legalName: string | null;
  taxId: string | null;
  type: string;
  status: string;
}

export interface Producer {
  id: string;
  organizationId: string;
  businessName: string;
  personType: 'FISICA' | 'JURIDICA';
  taxId: string | null;
  status: string;
  email: string | null;
  phone: string | null;
  province: string | null;
  locality: string | null;
  createdAt: string;
  renapa?: RenapaRegistration[];
}

export interface RenapaRegistration {
  id: string;
  producerId: string;
  number: string;
  status: string;
  syncStatus: string;
  issuedAt: string | null;
}

export interface Establishment {
  id: string;
  organizationId: string;
  producerId: string | null;
  name: string;
  type: string;
  address: string | null;
  locality: string | null;
  province: string | null;
  latitude: string | null;
  longitude: string | null;
  status: string;
  rne: string | null;
  renspa?: RenspaRegistration[];
}

export interface RenspaRegistration {
  id: string;
  establishmentId: string;
  producerId: string;
  number: string;
  activity: string | null;
  status: string;
  syncStatus: string;
}

export interface Apiary {
  id: string;
  establishmentId: string;
  establishmentName?: string;
  code: string;
  name: string | null;
  latitude: string | null;
  longitude: string | null;
  locality: string | null;
  province: string | null;
  hiveCount: number;
  status: string;
  registeredAt: string | null;
}

export interface Hive {
  id: string;
  apiaryId: string;
  code: string;
  identifier: string | null;
  type: string | null;
  status: string;
  installedAt: string | null;
}

export type MovementStatus =
  | 'DRAFT'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'PARTIALLY_RECEIVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface Movement {
  id: string;
  code: string;
  movementType: string;
  materialType: string;
  originEstablishmentId: string;
  originApiaryId: string | null;
  destinationEstablishmentId: string;
  scheduledAt: string;
  dispatchedAt: string | null;
  receivedAt: string | null;
  quantity: string;
  unit: string;
  status: MovementStatus;
  requiresDocument: boolean;
  requiredDocumentType: string | null;
  notes: string | null;
  appliedRule?: {
    requiresDocument: boolean;
    requiredDocumentType: string | null;
    ruleName: string | null;
    legalReference: string | null;
  };
  origin?: Establishment;
  destination?: Establishment;
  dte?: Dte | null;
  reception?: Reception | null;
}

export interface Dte {
  id: string;
  movementId: string;
  number: string | null;
  status: string;
  issuedAt: string | null;
  closedAt: string | null;
  originRenspa: string | null;
  destinationRenspa: string | null;
  syncStatus: string;
}

export interface Reception {
  id: string;
  movementId: string;
  receivedAt: string;
  receivedQuantity: string;
  unit: string;
  result: string;
  hasDiscrepancy: boolean;
  discrepancyNotes: string | null;
}

export interface Extraction {
  id: string;
  code: string;
  establishmentId: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  inputQuantity: string;
  outputQuantity: string | null;
  unit: string;
  operatorName: string | null;
  inputs?: { movementId: string; movementCode: string; quantity: string; unit: string }[];
}

export interface Lot {
  id: string;
  code: string;
  organizationId: string;
  establishmentId: string;
  extractionId: string | null;
  lotType: string;
  productionDate: string;
  quantity: string;
  availableQuantity: string;
  unit: string;
  status: string;
  honeyType: string | null;
  moisturePercent: string | null;
  color: string | null;
  inputs?: LotInput[];
  drums?: Drum[];
  summary?: {
    drumCount: number;
    netWeightInDrums: number;
    quantity: number;
    availableQuantity: number;
  };
}

export interface LotInput {
  id: string;
  lotId: string;
  sourceType: 'MOVEMENT' | 'LOT' | 'EXTRACTION' | 'MANUAL';
  sourceMovementId: string | null;
  sourceLotId: string | null;
  sourceExtractionId: string | null;
  quantity: string;
  unit: string;
}

export interface Drum {
  id: string;
  code: string;
  lotId: string;
  locationEstablishmentId: string | null;
  netWeight: string;
  tareWeight: string | null;
  grossWeight: string | null;
  unit: string;
  status: string;
  sealNumber: string | null;
  filledAt: string | null;
}

export type TraceNodeType =
  | 'producer'
  | 'renapa'
  | 'renspa'
  | 'establishment'
  | 'apiary'
  | 'movement'
  | 'dte'
  | 'reception'
  | 'extraction'
  | 'lot'
  | 'drum';

export interface TraceNode {
  key: string;
  type: TraceNodeType;
  id: string;
  label: string;
  depth?: number;
  attributes: Record<string, unknown>;
}

export interface TraceEdge {
  from: string;
  to: string;
  relation: string;
}

export interface TraceGap {
  severity: 'WARNING' | 'ERROR';
  code: string;
  message: string;
  entity?: { type: TraceNodeType; id: string; label?: string };
}

export interface TraceResult {
  direction: 'backward' | 'forward';
  root: TraceNode;
  nodes: TraceNode[];
  edges: TraceEdge[];
  summary: {
    producers: { id: string; businessName: string; renapa: string[] }[];
    renspa: string[];
    apiaries: { id: string; code: string; establishmentId: string }[];
    establishments: { id: string; name: string; type: string }[];
    movements: { id: string; code: string; status: string; dteNumber: string | null }[];
    lots: { id: string; code: string; status: string }[];
    drums: { id: string; code: string; netWeight: string }[];
  };
  gaps: TraceGap[];
  complete: boolean;
  generatedAt: string;
}

export interface TimelineEvent {
  id: string;
  eventType: string;
  occurredAt: string;
  recordedAt: string;
  actorUserId: string | null;
  correlationId: string | null;
  payload: Record<string, unknown> | null;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  source: string;
  correlationId: string | null;
}

export interface MovementRule {
  id: string;
  name: string;
  movementType: string | null;
  materialType: string | null;
  originType: string | null;
  destinationType: string | null;
  requiresDocument: boolean;
  requiredDocumentType: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  priority: number;
  active: boolean;
  legalReference: string | null;
}
