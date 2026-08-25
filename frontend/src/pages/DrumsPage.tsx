import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, apiSend } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useResource } from '../lib/useResource';
import { formatDate, formatQuantity, humanize, toLocalInput } from '../lib/format';
import {
  Card,
  Empty,
  FormFields,
  Modal,
  Notice,
  Spinner,
  StatusBadge,
  useForm,
  type FieldSpec,
} from '../components/ui';
import type { Drum, Establishment, Paginated } from '../lib/types';

export const DrumsPage = () => {
  const { canWrite } = useAuth();
  const [status, setStatus] = useState('');
  const [transferring, setTransferring] = useState<Drum | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const list = useResource<Paginated<Drum>>(
    `/drums?pageSize=50${status ? `&status=${status}` : ''}`,
  );
  const establishments = useResource<Paginated<Establishment>>('/establishments?pageSize=100');
  const byId = new Map((establishments.data?.data ?? []).map((e) => [e.id, e.name]));

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Tambores</h1>
          <p className="lead">
            Unidad física asociada a un lote. Cambiar su ubicación deja rastro en el historial de
            inventario, de modo que la trazabilidad no se pierde al moverlo.
          </p>
        </div>
      </div>

      {flash && <Notice tone="ok">{flash}</Notice>}
      {list.error && <Notice tone="danger">{list.error}</Notice>}

      <div className="toolbar">
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Estado">
          <option value="">Todos los estados</option>
          {['FILLED', 'IN_STOCK', 'IN_TRANSIT', 'DISPATCHED', 'CONSUMED', 'EMPTY'].map((option) => (
            <option key={option} value={option}>
              {humanize(option)}
            </option>
          ))}
        </select>
        {list.loading && <Spinner />}
      </div>

      <Card tight>
        {list.data && list.data.data.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th className="num">Neto</th>
                  <th>Ubicación</th>
                  <th>Llenado</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.data.data.map((drum) => (
                  <tr key={drum.id}>
                    <td className="mono">
                      <strong>{drum.code}</strong>
                    </td>
                    <td className="num">{formatQuantity(drum.netWeight, drum.unit)}</td>
                    <td className="small muted">
                      {drum.locationEstablishmentId
                        ? (byId.get(drum.locationEstablishmentId) ?? 'Otro establecimiento')
                        : '—'}
                    </td>
                    <td className="small nowrap">{formatDate(drum.filledAt)}</td>
                    <td>
                      <StatusBadge status={drum.status} />
                    </td>
                    <td>
                      <div className="row">
                        <Link className="btn small" to={`/trace/backward/drum/${drum.id}`}>
                          Origen
                        </Link>
                        {canWrite && drum.status !== 'CONSUMED' && (
                          <button
                            type="button"
                            className="small"
                            onClick={() => setTransferring(drum)}
                          >
                            Transferir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !list.loading && (
            <Empty
              title="Sin tambores"
              description="Los tambores se registran desde el detalle de un lote."
            />
          )
        )}
      </Card>

      {transferring && (
        <TransferModal
          drum={transferring}
          establishments={establishments.data?.data ?? []}
          onClose={() => setTransferring(null)}
          onDone={(message) => {
            setTransferring(null);
            setFlash(message);
            list.reload();
          }}
        />
      )}
    </div>
  );
};

const TransferModal = ({
  drum,
  establishments,
  onClose,
  onDone,
}: {
  drum: Drum;
  establishments: Establishment[];
  onClose: () => void;
  onDone: (message: string) => void;
}) => {
  const fields: FieldSpec[] = [
    {
      name: 'toEstablishmentId',
      label: 'Nuevo establecimiento',
      type: 'select',
      required: true,
      full: true,
      options: establishments
        .filter((e) => e.id !== drum.locationEstablishmentId)
        .map((e) => ({ value: e.id, label: `${e.name} (${humanize(e.type)})` })),
    },
    { name: 'occurredAt', label: 'Fecha del traslado', type: 'datetime-local', defaultValue: toLocalInput() },
    { name: 'notes', label: 'Observaciones', type: 'textarea', full: true },
  ];

  const { values, set } = useForm(fields);
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
        body[key] = key === 'occurredAt' ? new Date(value).toISOString() : value;
      }
      const result = await apiSend('POST', `/drums/${drum.id}/transfer`, body, {
        label: `Transferencia del tambor ${drum.code}`,
        entity: '/drums',
      });
      onDone(
        result.queued
          ? 'Sin conexión: la transferencia quedó en la cola.'
          : `Tambor ${drum.code} transferido.`,
      );
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'No se pudo transferir el tambor.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Transferir tambor ${drum.code}`} onClose={onClose}>
      <FormFields
        fields={fields}
        values={values}
        onChange={set}
        onSubmit={submit}
        submitLabel="Transferir"
        onCancel={onClose}
        busy={busy}
        error={error}
      />
    </Modal>
  );
};
