import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, apiSend } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useResource } from '../lib/useResource';
import { formatDateTime, formatQuantity, humanize, toLocalInput } from '../lib/format';
import {
  Badge,
  Card,
  FormFields,
  Modal,
  Notice,
  Spinner,
  StatusBadge,
  useForm,
  type FieldSpec,
} from '../components/ui';
import type { Movement, TimelineEvent } from '../lib/types';

type Action = 'dte' | 'dispatch' | 'receive' | 'close' | 'cancel' | null;

export const MovementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { canWrite } = useAuth();
  const [action, setAction] = useState<Action>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const movement = useResource<Movement>(id ? `/movements/${id}` : null);
  const timeline = useResource<{ events: TimelineEvent[] }>(
    id ? `/traceability/timeline/movement/${id}` : null,
  );

  if (movement.loading) return <Spinner label="Cargando movimiento…" />;
  if (movement.error) return <Notice tone="danger">{movement.error}</Notice>;
  if (!movement.data) return null;

  const data = movement.data;
  const dte = data.dte;
  const canDispatch = data.status === 'DRAFT';
  const canReceive = ['DISPATCHED', 'IN_TRANSIT'].includes(data.status);
  const canCloseDte =
    dte && ['ISSUED', 'APPROVED'].includes(dte.status) &&
    ['RECEIVED', 'PARTIALLY_RECEIVED'].includes(data.status);

  const reload = () => {
    movement.reload();
    timeline.reload();
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <div className="row">
            <h1 className="mono">{data.code}</h1>
            <StatusBadge status={data.status} />
          </div>
          <p className="lead">
            {humanize(data.movementType)} · {formatQuantity(data.quantity, data.unit)} ·{' '}
            {data.origin?.name ?? '—'} → {data.destination?.name ?? '—'}
          </p>
        </div>
        <Link className="btn" to={`/trace/forward/movement/${data.id}`}>
          Ver trazabilidad
        </Link>
      </div>

      {flash && <Notice tone="ok">{flash}</Notice>}

      {data.requiresDocument && !dte && (
        <Notice tone="warn">
          Este movimiento requiere <strong>{data.requiredDocumentType}</strong> y todavía no lo
          tiene. No podrá despacharse hasta registrarlo.
        </Notice>
      )}

      {dte?.syncStatus === 'PENDING_SYNC' && (
        <Notice tone="info">
          El DT-e está registrado en BeeTrace pero <strong>no sincronizado con SIGSA</strong>. La
          operación no se pierde: queda pendiente hasta que exista la integración.
        </Notice>
      )}

      {canWrite && (
        <div className="row">
          {!dte && (
            <button type="button" className="primary" onClick={() => setAction('dte')}>
              Registrar DT-e
            </button>
          )}
          {canDispatch && (
            <button type="button" className="primary" onClick={() => setAction('dispatch')}>
              Despachar
            </button>
          )}
          {canReceive && (
            <button type="button" className="primary" onClick={() => setAction('receive')}>
              Registrar recepción
            </button>
          )}
          {canCloseDte && (
            <button type="button" onClick={() => setAction('close')}>
              Cerrar DT-e
            </button>
          )}
          {['DRAFT', 'DISPATCHED'].includes(data.status) && (
            <button type="button" className="danger" onClick={() => setAction('cancel')}>
              Cancelar
            </button>
          )}
        </div>
      )}

      <div className="grid cols-2">
        <Card title="Movimiento">
          <dl className="definition">
            <dt>Tipo</dt>
            <dd>{humanize(data.movementType)}</dd>
            <dt>Material</dt>
            <dd>{humanize(data.materialType)}</dd>
            <dt>Origen</dt>
            <dd>
              {data.origin?.name ?? '—'}
              {data.originApiaryId && <span className="small muted"> · desde apiario</span>}
            </dd>
            <dt>Destino</dt>
            <dd>{data.destination?.name ?? '—'}</dd>
            <dt>Cantidad</dt>
            <dd>{formatQuantity(data.quantity, data.unit)}</dd>
            <dt>Programado</dt>
            <dd>{formatDateTime(data.scheduledAt)}</dd>
            <dt>Despachado</dt>
            <dd>{formatDateTime(data.dispatchedAt)}</dd>
            <dt>Recibido</dt>
            <dd>{formatDateTime(data.receivedAt)}</dd>
            {data.notes && (
              <>
                <dt>Observaciones</dt>
                <dd>{data.notes}</dd>
              </>
            )}
          </dl>
        </Card>

        <Card title="Documento sanitario">
          {dte ? (
            <dl className="definition">
              <dt>Número</dt>
              <dd className="mono">{dte.number ?? 'sin asignar'}</dd>
              <dt>Estado interno</dt>
              <dd>
                <StatusBadge status={dte.status} />
              </dd>
              <dt>Sincronización</dt>
              <dd>
                <StatusBadge status={dte.syncStatus} />
              </dd>
              <dt>RENSPA origen</dt>
              <dd className="mono">{dte.originRenspa ?? '—'}</dd>
              <dt>RENSPA destino</dt>
              <dd className="mono">{dte.destinationRenspa ?? '—'}</dd>
              <dt>Emitido</dt>
              <dd>{formatDateTime(dte.issuedAt)}</dd>
              <dt>Cerrado</dt>
              <dd>{formatDateTime(dte.closedAt)}</dd>
            </dl>
          ) : (
            <p className="muted small">
              Sin documento asociado.{' '}
              {data.requiresDocument
                ? 'La regla vigente lo exige para este traslado.'
                : 'La regla vigente no lo exige para este traslado.'}
            </p>
          )}

          {data.reception && (
            <>
              <h3 className="mt">Recepción</h3>
              <dl className="definition">
                <dt>Fecha</dt>
                <dd>{formatDateTime(data.reception.receivedAt)}</dd>
                <dt>Cantidad recibida</dt>
                <dd>
                  {formatQuantity(data.reception.receivedQuantity, data.reception.unit)}{' '}
                  {data.reception.hasDiscrepancy && <Badge tone="warn">con diferencia</Badge>}
                </dd>
                <dt>Resultado</dt>
                <dd>
                  <StatusBadge status={data.reception.result} />
                </dd>
                {data.reception.discrepancyNotes && (
                  <>
                    <dt>Motivo</dt>
                    <dd>{data.reception.discrepancyNotes}</dd>
                  </>
                )}
              </dl>
            </>
          )}
        </Card>
      </div>

      <Card title="Historial del movimiento">
        {timeline.data && timeline.data.events.length > 0 ? (
          <ul className="timeline">
            {timeline.data.events.map((event) => (
              <li key={event.id}>
                <strong>{event.eventType}</strong>
                <div className="when">
                  Registrado {formatDateTime(event.recordedAt)}
                  {event.occurredAt !== event.recordedAt && (
                    <> · ocurrió {formatDateTime(event.occurredAt)}</>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">Sin eventos registrados.</p>
        )}
      </Card>

      {action && (
        <ActionModal
          action={action}
          movement={data}
          onClose={() => setAction(null)}
          onDone={(message) => {
            setAction(null);
            setFlash(message);
            reload();
          }}
        />
      )}
    </div>
  );
};

const ActionModal = ({
  action,
  movement,
  onClose,
  onDone,
}: {
  action: Exclude<Action, null>;
  movement: Movement;
  onClose: () => void;
  onDone: (message: string) => void;
}) => {
  const config: Record<
    Exclude<Action, null>,
    { title: string; fields: FieldSpec[]; path: string; submit: string; notice?: string }
  > = {
    dte: {
      title: 'Registrar DT-e',
      path: `/movements/${movement.id}/dte`,
      submit: 'Registrar DT-e',
      notice:
        'Sin integración con SIGSA el documento queda pendiente de sincronizar, y así lo reporta la trazabilidad.',
      fields: [
        {
          name: 'number',
          label: 'Número de DT-e',
          full: true,
          help: 'Si se omite, el documento queda en borrador hasta que SIGSA asigne número.',
        },
        { name: 'issuedAt', label: 'Fecha de emisión', type: 'datetime-local', defaultValue: toLocalInput() },
      ],
    },
    dispatch: {
      title: 'Despachar movimiento',
      path: `/movements/${movement.id}/dispatch`,
      submit: 'Despachar',
      fields: [
        {
          name: 'dispatchedAt',
          label: 'Fecha y hora de salida',
          type: 'datetime-local',
          defaultValue: toLocalInput(),
        },
      ],
    },
    receive: {
      title: 'Registrar recepción',
      path: `/movements/${movement.id}/receive`,
      submit: 'Confirmar recepción',
      notice: `Cantidad declarada en origen: ${formatQuantity(movement.quantity, movement.unit)}. Si difiere, hay que dejar constancia del motivo.`,
      fields: [
        {
          name: 'receivedQuantity',
          label: 'Cantidad recibida',
          type: 'number',
          step: '0.001',
          required: true,
          defaultValue: movement.quantity,
        },
        {
          name: 'receivedAt',
          label: 'Fecha y hora',
          type: 'datetime-local',
          defaultValue: toLocalInput(),
        },
        {
          name: 'discrepancyNotes',
          label: 'Motivo de la diferencia',
          type: 'textarea',
          full: true,
          help: 'Obligatorio si la cantidad recibida difiere de la declarada.',
        },
      ],
    },
    close: {
      title: 'Cerrar DT-e',
      path: `/movements/${movement.id}/dte/close`,
      submit: 'Cerrar documento',
      notice: 'El cierre lo realiza el establecimiento receptor una vez registrada la recepción.',
      fields: [
        {
          name: 'closedAt',
          label: 'Fecha y hora de cierre',
          type: 'datetime-local',
          defaultValue: toLocalInput(),
        },
      ],
    },
    cancel: {
      title: 'Cancelar movimiento',
      path: `/movements/${movement.id}/cancel`,
      submit: 'Cancelar movimiento',
      fields: [{ name: 'reason', label: 'Motivo', type: 'textarea', required: true, full: true }],
    },
  };

  const current = config[action];
  const { values, set } = useForm(current.fields);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(values)) {
        if (value === '') continue;
        body[key] = /At$/.test(key)
          ? new Date(value).toISOString()
          : key === 'receivedQuantity'
            ? Number(value)
            : value;
      }

      const result = await apiSend('POST', current.path, body, {
        label: `${current.title} — ${movement.code}`,
        entity: '/movements',
      });
      onDone(
        result.queued
          ? 'Sin conexión: la operación quedó en la cola y se enviará al recuperar señal.'
          : `${current.title} completado para ${movement.code}.`,
      );
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'No se pudo completar la operación.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={current.title} onClose={onClose}>
      {current.notice && <Notice tone="info">{current.notice}</Notice>}
      <FormFields
        fields={current.fields}
        values={values}
        onChange={set}
        onSubmit={submit}
        submitLabel={current.submit}
        onCancel={onClose}
        busy={busy}
        error={error}
      />
    </Modal>
  );
};
