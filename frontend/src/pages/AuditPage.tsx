import { useState } from 'react';
import { useResource } from '../lib/useResource';
import { formatDateTime } from '../lib/format';
import { Badge, Card, Empty, Notice, Spinner } from '../components/ui';
import type { AuditEvent, Paginated } from '../lib/types';

export const AuditPage = () => {
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');

  const query = [
    'pageSize=50',
    entityType && `entityType=${entityType}`,
    action && `action=${encodeURIComponent(action)}`,
  ]
    .filter(Boolean)
    .join('&');

  const events = useResource<Paginated<AuditEvent>>(`/audit/events?${query}`);

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Auditoría</h1>
          <p className="lead">
            Registro independiente de las tablas operativas: quién hizo qué, sobre qué entidad y
            cuándo. Se escribe automáticamente y nunca hace fallar la operación de negocio.
          </p>
        </div>
      </div>

      {events.error && (
        <Notice tone="danger">
          {events.error} Esta consulta requiere rol ADMIN o AUDITOR.
        </Notice>
      )}

      <div className="toolbar">
        <select
          value={entityType}
          onChange={(event) => setEntityType(event.target.value)}
          aria-label="Tipo de entidad"
        >
          <option value="">Todas las entidades</option>
          {['movement', 'lot', 'drum', 'producer', 'establishment', 'apiary', 'dte', 'user'].map(
            (option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ),
          )}
        </select>
        <input
          type="search"
          placeholder="Acción, p. ej. MOVEMENT_CREATED"
          value={action}
          onChange={(event) => setAction(event.target.value)}
          aria-label="Filtrar por acción"
        />
        {events.loading && <Spinner />}
      </div>

      <Card tight>
        {events.data && events.data.data.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Momento</th>
                  <th>Actor</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>Origen</th>
                </tr>
              </thead>
              <tbody>
                {events.data.data.map((event) => (
                  <tr key={event.id}>
                    <td className="small nowrap">{formatDateTime(event.timestamp)}</td>
                    <td className="small">{event.actorEmail ?? <span className="faint">sistema</span>}</td>
                    <td>
                      <Badge tone="accent">{event.action}</Badge>
                    </td>
                    <td className="small mono">
                      {event.entityType}
                      {event.entityId && (
                        <span className="faint"> · {event.entityId.slice(0, 8)}</span>
                      )}
                    </td>
                    <td className="small faint">{event.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !events.loading &&
          !events.error && <Empty title="Sin eventos" description="No hay auditoría para ese filtro." />
        )}
      </Card>
    </div>
  );
};
