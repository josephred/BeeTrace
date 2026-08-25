import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useResource } from '../lib/useResource';
import { formatDateTime, formatRelative, humanize } from '../lib/format';
import { TraceGraph } from '../components/TraceGraph';
import { Badge, Card, Empty, Notice, Spinner, Stat } from '../components/ui';
import type { Apiary, Lot, Paginated, TraceResult } from '../lib/types';

type Direction = 'backward' | 'forward';
type EntityType = 'lot' | 'drum' | 'apiary' | 'producer' | 'establishment' | 'movement';

const buildPath = (direction: Direction, entityType: EntityType, id: string): string => {
  if (direction === 'backward') {
    // El backend expone la consulta hacia atras desde el lote y desde el tambor,
    // que son los dos puntos de partida naturales de una investigacion.
    return entityType === 'drum'
      ? `/drums/${id}/trace/backward`
      : `/lots/${id}/trace/backward`;
  }
  return `/traceability/forward/${entityType}/${id}`;
};

export const TracePage = () => {
  const params = useParams<{ direction?: Direction; entityType?: EntityType; id?: string }>();
  const navigate = useNavigate();

  const [direction, setDirection] = useState<Direction>(params.direction ?? 'backward');
  const [entityType, setEntityType] = useState<EntityType>(params.entityType ?? 'lot');
  const [entityId, setEntityId] = useState(params.id ?? '');

  useEffect(() => {
    if (params.direction) setDirection(params.direction);
    if (params.entityType) setEntityType(params.entityType);
    if (params.id) setEntityId(params.id);
  }, [params.direction, params.entityType, params.id]);

  const lots = useResource<Paginated<Lot>>('/lots?pageSize=100');
  const apiaries = useResource<Paginated<Apiary>>('/apiaries?pageSize=100');

  const path = entityId ? buildPath(direction, entityType, entityId) : null;
  const trace = useResource<TraceResult>(path);

  const options =
    entityType === 'lot'
      ? (lots.data?.data ?? []).map((lot) => ({ id: lot.id, label: `${lot.code} (${humanize(lot.lotType)})` }))
      : entityType === 'apiary'
        ? (apiaries.data?.data ?? []).map((apiary) => ({
            id: apiary.id,
            label: `${apiary.code} — ${apiary.name ?? ''}`,
          }))
        : [];

  const apply = (nextDirection: Direction, nextEntity: EntityType, nextId: string) => {
    setDirection(nextDirection);
    setEntityType(nextEntity);
    setEntityId(nextId);
    if (nextId) navigate(`/trace/${nextDirection}/${nextEntity}/${nextId}`, { replace: true });
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Trazabilidad</h1>
          <p className="lead">
            Hacia atrás responde de dónde vino la miel; hacia adelante, dónde terminó la producción
            de un origen. El grafo muestra la cadena y los huecos detectados.
          </p>
        </div>
      </div>

      <Card>
        <div className="form-row">
          <div className="field">
            <label htmlFor="direction">Sentido</label>
            <select
              id="direction"
              value={direction}
              onChange={(event) => {
                const next = event.target.value as Direction;
                const nextEntity: EntityType = next === 'backward' ? 'lot' : entityType;
                apply(next, nextEntity, next === 'backward' && entityType !== 'lot' && entityType !== 'drum' ? '' : entityId);
              }}
            >
              <option value="backward">Hacia atrás — ¿de dónde vino?</option>
              <option value="forward">Hacia adelante — ¿dónde terminó?</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="entityType">Punto de partida</label>
            <select
              id="entityType"
              value={entityType}
              onChange={(event) => apply(direction, event.target.value as EntityType, '')}
            >
              {direction === 'backward' ? (
                <>
                  <option value="lot">Lote</option>
                  <option value="drum">Tambor</option>
                </>
              ) : (
                <>
                  <option value="apiary">Apiario</option>
                  <option value="lot">Lote</option>
                  <option value="producer">Productor</option>
                  <option value="establishment">Establecimiento</option>
                  <option value="movement">Movimiento</option>
                </>
              )}
            </select>
          </div>

          <div className="field" style={{ gridColumn: options.length > 0 ? undefined : '1 / -1' }}>
            <label htmlFor="entityId">
              {entityType === 'lot' ? 'Lote' : entityType === 'apiary' ? 'Apiario' : 'Identificador'}
            </label>
            {options.length > 0 ? (
              <select
                id="entityId"
                value={entityId}
                onChange={(event) => apply(direction, entityType, event.target.value)}
              >
                <option value="">— Seleccionar —</option>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="entityId"
                value={entityId}
                onChange={(event) => setEntityId(event.target.value)}
                onBlur={() => apply(direction, entityType, entityId)}
                placeholder="UUID de la entidad"
              />
            )}
          </div>
        </div>
      </Card>

      {!path && (
        <Empty
          title="Elegí un punto de partida"
          description="La consulta hacia atrás arranca de un lote o un tambor. La consulta hacia adelante puede arrancar de un apiario, un productor o un movimiento."
        />
      )}

      {trace.loading && <Spinner label="Reconstruyendo la cadena…" />}
      {trace.error && <Notice tone="danger">{trace.error}</Notice>}
      {trace.fromCache && (
        <Notice tone="warn">
          Trazabilidad reconstruida con datos locales de {formatRelative(trace.cachedAt)}. Puede no
          reflejar operaciones recientes de otras organizaciones.
        </Notice>
      )}

      {trace.data && (
        <>
          <div className="grid cols-4">
            <Stat
              label="Nodos"
              value={trace.data.nodes.length}
              hint={`${trace.data.edges.length} relaciones`}
            />
            <Stat
              label="Productores"
              value={trace.data.summary.producers.length}
              hint={trace.data.summary.producers[0]?.businessName ?? '—'}
            />
            <Stat
              label="Apiarios"
              value={trace.data.summary.apiaries.length}
              hint={trace.data.summary.apiaries.map((a) => a.code).join(', ') || '—'}
            />
            <Stat
              label="Estado de la cadena"
              value={
                // "Completa" solo cuando no falta nada. Con advertencias la cadena
                // se reconstruye, pero decir que esta completa seria enganoso.
                trace.data.gaps.length === 0 ? (
                  <Badge tone="ok">Completa</Badge>
                ) : trace.data.gaps.some((gap) => gap.severity === 'ERROR') ? (
                  <Badge tone="danger">Con errores</Badge>
                ) : (
                  <Badge tone="warn">Con observaciones</Badge>
                )
              }
              hint={
                trace.data.gaps.length === 0
                  ? `generada ${formatDateTime(trace.data.generatedAt)}`
                  : `${trace.data.gaps.length} punto(s) a revisar`
              }
            />
          </div>

          {trace.data.gaps.length > 0 && (
            <Card title={`Huecos detectados (${trace.data.gaps.length})`}>
              <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                {trace.data.gaps.map((gap, index) => (
                  <li key={`${gap.code}-${index}`} style={{ marginBottom: '0.4rem' }}>
                    <Badge tone={gap.severity === 'ERROR' ? 'danger' : 'warn'}>{gap.code}</Badge>{' '}
                    {gap.message}
                  </li>
                ))}
              </ul>
              <p className="small muted mt">
                La trazabilidad real rara vez está completa. El sistema informa qué falta en lugar
                de presentar la cadena como si estuviera cerrada.
              </p>
            </Card>
          )}

          <Card
            title={`Cadena ${trace.data.direction === 'backward' ? 'hacia atrás' : 'hacia adelante'}`}
            actions={<span className="small muted">Tocá un nodo para ver su detalle</span>}
          >
            <TraceGraph result={trace.data} />
          </Card>

          <div className="grid cols-2">
            <Card title="Origen productivo">
              <dl className="definition">
                <dt>Productores</dt>
                <dd>
                  {trace.data.summary.producers.length > 0
                    ? trace.data.summary.producers.map((producer) => (
                        <div key={producer.id}>
                          {producer.businessName}
                          {producer.renapa.length > 0 && (
                            <span className="small muted"> · RENAPA {producer.renapa.join(', ')}</span>
                          )}
                        </div>
                      ))
                    : '—'}
                </dd>
                <dt>RENSPA</dt>
                <dd className="mono small">{trace.data.summary.renspa.join(' · ') || '—'}</dd>
                <dt>Establecimientos</dt>
                <dd className="small">
                  {trace.data.summary.establishments
                    .map((establishment) => establishment.name)
                    .join(' · ') || '—'}
                </dd>
              </dl>
            </Card>

            <Card title="Producto y documentación">
              <dl className="definition">
                <dt>Movimientos</dt>
                <dd className="small">
                  {trace.data.summary.movements.length > 0
                    ? trace.data.summary.movements.map((movement) => (
                        <div key={movement.id}>
                          <span className="mono">{movement.code}</span>{' '}
                          <Badge>{movement.status}</Badge>{' '}
                          {movement.dteNumber && (
                            <span className="small muted">DT-e {movement.dteNumber}</span>
                          )}
                        </div>
                      ))
                    : '—'}
                </dd>
                <dt>Lotes</dt>
                <dd className="small mono">
                  {trace.data.summary.lots.map((lot) => lot.code).join(' · ') || '—'}
                </dd>
                <dt>Tambores</dt>
                <dd className="small mono">
                  {trace.data.summary.drums.map((drum) => drum.code).join(' · ') || '—'}
                </dd>
              </dl>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
