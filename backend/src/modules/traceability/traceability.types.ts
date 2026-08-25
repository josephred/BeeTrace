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
  attributes: Record<string, unknown>;
  depth?: number;
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

export const nodeKey = (type: TraceNodeType, id: string): string => `${type}:${id}`;
