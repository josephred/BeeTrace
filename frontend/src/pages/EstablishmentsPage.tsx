import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, apiSend } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useResource } from '../lib/useResource';
import { formatRelative, humanize } from '../lib/format';
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
import type { Establishment, Paginated, Producer } from '../lib/types';

const TYPE_OPTIONS = [
  { value: 'APIARIO_BASE', label: 'Predio apícola (apiarios)' },
  { value: 'SALA_EXTRACCION', label: 'Sala de extracción' },
  { value: 'ACOPIO', label: 'Acopio' },
  { value: 'FRACCIONADORA', label: 'Fraccionadora' },
  { value: 'DEPOSITO', label: 'Depósito' },
  { value: 'LABORATORIO', label: 'Laboratorio' },
  { value: 'OTRO', label: 'Otro' },
];

export const EstablishmentsPage = () => {
  const { canWrite } = useAuth();
  const [typeFilter, setTypeFilter] = useState('');
  const [creating, setCreating] = useState(false);
  const [renspaFor, setRenspaFor] = useState<Establishment | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const list = useResource<Paginated<Establishment>>(
    `/establishments?pageSize=50${typeFilter ? `&type=${typeFilter}` : ''}`,
  );
  const producers = useResource<Paginated<Producer>>('/producers?pageSize=100');

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Establecimientos</h1>
          <p className="lead">
            El establecimiento es la unidad territorial. Su RENSPA lo identifica junto con su
            titular, y no debe confundirse con el apiario, que es una unidad productiva dentro de él.
          </p>
        </div>
        {canWrite && (
          <button type="button" className="primary" onClick={() => setCreating(true)}>
            Nuevo establecimiento
          </button>
        )}
      </div>

      {flash && <Notice tone="ok">{flash}</Notice>}
      {list.fromCache && (
        <Notice tone="warn">Datos locales guardados {formatRelative(list.cachedAt)}.</Notice>
      )}
      {list.error && <Notice tone="danger">{list.error}</Notice>}

      <div className="toolbar">
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          aria-label="Filtrar por tipo"
        >
          <option value="">Todos los tipos</option>
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
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
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Ubicación</th>
                  <th>RNE</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.data.data.map((establishment) => (
                  <tr key={establishment.id}>
                    <td>
                      <strong>{establishment.name}</strong>
                    </td>
                    <td>{humanize(establishment.type)}</td>
                    <td className="small muted">
                      {[establishment.locality, establishment.province].filter(Boolean).join(', ') ||
                        '—'}
                    </td>
                    <td className="mono small">{establishment.rne ?? '—'}</td>
                    <td>
                      <StatusBadge status={establishment.status} />
                    </td>
                    <td>
                      <div className="row">
                        <Link
                          className="btn small"
                          to={`/trace/forward/establishment/${establishment.id}`}
                        >
                          Trazabilidad
                        </Link>
                        {canWrite && (
                          <button
                            type="button"
                            className="small"
                            onClick={() => setRenspaFor(establishment)}
                          >
                            Asociar RENSPA
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
              title="Sin establecimientos"
              description="Los movimientos conectan un establecimiento de origen con uno de destino: sin ellos no hay cadena."
            />
          )
        )}
      </Card>

      {creating && (
        <CreateEstablishmentModal
          producers={producers.data?.data ?? []}
          onClose={() => setCreating(false)}
          onDone={(message) => {
            setCreating(false);
            setFlash(message);
            list.reload();
          }}
        />
      )}

      {renspaFor && (
        <RenspaModal
          establishment={renspaFor}
          producers={producers.data?.data ?? []}
          onClose={() => setRenspaFor(null)}
          onDone={(message) => {
            setRenspaFor(null);
            setFlash(message);
            list.reload();
          }}
        />
      )}
    </div>
  );
};

const CreateEstablishmentModal = ({
  producers,
  onClose,
  onDone,
}: {
  producers: Producer[];
  onClose: () => void;
  onDone: (message: string) => void;
}) => {
  const fields: FieldSpec[] = [
    { name: 'name', label: 'Nombre', required: true, full: true },
    { name: 'type', label: 'Tipo', type: 'select', required: true, options: TYPE_OPTIONS },
    {
      name: 'producerId',
      label: 'Productor responsable',
      type: 'select',
      options: producers.map((p) => ({ value: p.id, label: p.businessName })),
      help: 'Opcional. Una sala o un acopio puede no tener productor asociado.',
    },
    { name: 'locality', label: 'Localidad' },
    { name: 'province', label: 'Provincia' },
    { name: 'latitude', label: 'Latitud', type: 'number', step: 'any', placeholder: '-34.570300' },
    { name: 'longitude', label: 'Longitud', type: 'number', step: 'any', placeholder: '-59.105300' },
    { name: 'rne', label: 'RNE', help: 'Registro Nacional de Establecimiento (SIFeGA).' },
    { name: 'address', label: 'Domicilio', full: true },
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
        body[key] = key === 'latitude' || key === 'longitude' ? Number(value) : value;
      }
      const result = await apiSend<Establishment>('POST', '/establishments', body, {
        label: `Establecimiento ${values.name}`,
        entity: '/establishments',
      });
      onDone(
        result.queued
          ? 'Sin conexión: el establecimiento quedó en la cola.'
          : `Establecimiento ${result.data.name} registrado.`,
      );
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : 'No se pudo registrar el establecimiento.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Nuevo establecimiento" onClose={onClose}>
      <FormFields
        fields={fields}
        values={values}
        onChange={set}
        onSubmit={submit}
        submitLabel="Registrar establecimiento"
        onCancel={onClose}
        busy={busy}
        error={error}
      />
    </Modal>
  );
};

const RenspaModal = ({
  establishment,
  producers,
  onClose,
  onDone,
}: {
  establishment: Establishment;
  producers: Producer[];
  onClose: () => void;
  onDone: (message: string) => void;
}) => {
  const fields: FieldSpec[] = [
    { name: 'number', label: 'Número de RENSPA', required: true, placeholder: '01.006.0.00123/45' },
    {
      name: 'producerId',
      label: 'Titular',
      type: 'select',
      required: true,
      options: producers.map((p) => ({ value: p.id, label: p.businessName })),
      help: 'El RENSPA identifica al titular del predio, que puede no ser el apicultor.',
    },
    { name: 'activity', label: 'Actividad', defaultValue: 'Apícola' },
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      defaultValue: 'PENDING_VERIFICATION',
      options: [
        { value: 'PENDING_VERIFICATION', label: 'Pendiente de verificación' },
        { value: 'ACTIVE', label: 'Activo' },
        { value: 'SUSPENDED', label: 'Suspendido' },
      ],
    },
  ];

  const { values, set } = useForm(fields);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await apiSend(
        'POST',
        `/establishments/${establishment.id}/renspa`,
        Object.fromEntries(Object.entries(values).filter(([, value]) => value !== '')),
        {
          label: `RENSPA ${values.number} de ${establishment.name}`,
          entity: '/establishments',
        },
      );
      onDone(
        result.queued
          ? 'Sin conexión: la asociación quedó en la cola.'
          : `RENSPA ${values.number} asociado a ${establishment.name}.`,
      );
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'No se pudo asociar el RENSPA.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Asociar RENSPA a ${establishment.name}`} onClose={onClose}>
      <FormFields
        fields={fields}
        values={values}
        onChange={set}
        onSubmit={submit}
        submitLabel="Asociar RENSPA"
        onCancel={onClose}
        busy={busy}
        error={error}
      />
    </Modal>
  );
};
