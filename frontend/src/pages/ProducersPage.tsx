import { useState, type FormEvent } from 'react';
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
import type { Paginated, Producer } from '../lib/types';

const PRODUCER_FIELDS: FieldSpec[] = [
  { name: 'businessName', label: 'Nombre o razón social', required: true, full: true },
  {
    name: 'personType',
    label: 'Tipo de persona',
    type: 'select',
    options: [
      { value: 'FISICA', label: 'Física' },
      { value: 'JURIDICA', label: 'Jurídica' },
    ],
    defaultValue: 'FISICA',
  },
  {
    name: 'taxId',
    label: 'CUIT',
    placeholder: '20-12345678-9',
    help: 'Identificador fiscal externo. No es la clave interna del sistema.',
  },
  { name: 'province', label: 'Provincia' },
  { name: 'locality', label: 'Localidad' },
  { name: 'email', label: 'Correo', type: 'email' },
  { name: 'phone', label: 'Teléfono' },
];

const RENAPA_FIELDS: FieldSpec[] = [
  { name: 'number', label: 'Número de RENAPA', required: true, full: true },
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
  { name: 'issuedAt', label: 'Fecha de alta', type: 'date' },
];

export const ProducersPage = () => {
  const { user, canWrite } = useAuth();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [renapaFor, setRenapaFor] = useState<Producer | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const isProducerRole = user?.role === 'PRODUCTOR';
  const isAdminRole = user?.role === 'ADMIN';

  const query = search ? `&q=${encodeURIComponent(search)}` : '';
  const list = useResource<Paginated<Producer>>(`/producers?pageSize=50${query}`);

  const canCreateProducer =
    canWrite && (isAdminRole || (isProducerRole && list.data && list.data.data.length === 0));

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>{isProducerRole ? 'Mi Registro de Productor y RENAPA' : 'Productores'}</h1>
          <p className="lead">
            {isProducerRole
              ? 'Información fiscal y registro RENAPA del productor titular.'
              : 'El productor es el actor responsable de la actividad. Su RENAPA se registra aparte, porque son cosas distintas: un productor puede existir sin RENAPA vigente.'}
          </p>
        </div>
        {canCreateProducer && (
          <button type="button" className="primary" onClick={() => setCreating(true)}>
            {isProducerRole ? 'Registrar mis datos de productor' : 'Nuevo productor'}
          </button>
        )}
      </div>

      {flash && <Notice tone="ok">{flash}</Notice>}
      {list.fromCache && (
        <Notice tone="warn">
          Datos locales guardados {formatRelative(list.cachedAt)}. Sin conexión al servidor.
        </Notice>
      )}
      {list.error && <Notice tone="danger">{list.error}</Notice>}

      <div className="toolbar">
        <input
          type="search"
          placeholder="Buscar por nombre o CUIT…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Buscar productores"
        />
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
                  <th>CUIT</th>
                  <th>Ubicación</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.data.data.map((producer) => (
                  <tr key={producer.id}>
                    <td>
                      <strong>{producer.businessName}</strong>
                    </td>
                    <td>{humanize(producer.personType)}</td>
                    <td className="mono">{producer.taxId ?? '—'}</td>
                    <td className="small muted">
                      {[producer.locality, producer.province].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td>
                      <StatusBadge status={producer.status} />
                    </td>
                    <td>
                      {canWrite && (
                        <button
                          type="button"
                          className="small"
                          onClick={() => setRenapaFor(producer)}
                        >
                          Asociar RENAPA
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !list.loading && (
            <Empty
              title="Sin productores"
              description="Registrar el productor es el primer paso de la cadena de trazabilidad."
            />
          )
        )}
      </Card>

      {creating && (
        <CreateProducerModal
          onClose={() => setCreating(false)}
          onDone={(message) => {
            setCreating(false);
            setFlash(message);
            list.reload();
          }}
        />
      )}

      {renapaFor && (
        <RenapaModal
          producer={renapaFor}
          onClose={() => setRenapaFor(null)}
          onDone={(message) => {
            setRenapaFor(null);
            setFlash(message);
            list.reload();
          }}
        />
      )}
    </div>
  );
};

const CreateProducerModal = ({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (message: string) => void;
}) => {
  const { values, set } = useForm(PRODUCER_FIELDS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = Object.fromEntries(
        Object.entries(values).filter(([, value]) => value !== ''),
      );
      const result = await apiSend<Producer>('POST', '/producers', body, {
        label: `Productor ${values.businessName}`,
        entity: '/producers',
      });
      onDone(
        result.queued
          ? 'Sin conexión: el productor quedó en la cola y se enviará al recuperar señal.'
          : `Productor ${result.data.businessName} registrado.`,
      );
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'No se pudo registrar el productor.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Nuevo productor" onClose={onClose}>
      <FormFields
        fields={PRODUCER_FIELDS}
        values={values}
        onChange={set}
        onSubmit={submit}
        submitLabel="Registrar productor"
        onCancel={onClose}
        busy={busy}
        error={error}
      />
    </Modal>
  );
};

const RenapaModal = ({
  producer,
  onClose,
  onDone,
}: {
  producer: Producer;
  onClose: () => void;
  onDone: (message: string) => void;
}) => {
  const { values, set } = useForm(RENAPA_FIELDS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { number: values.number, status: values.status };
      if (values.issuedAt) body.issuedAt = new Date(values.issuedAt).toISOString();

      const result = await apiSend('POST', `/producers/${producer.id}/renapa`, body, {
        label: `RENAPA ${values.number} de ${producer.businessName}`,
        entity: '/producers',
      });
      onDone(
        result.queued
          ? 'Sin conexión: la asociación quedó en la cola.'
          : `RENAPA ${values.number} asociado. Queda pendiente de sincronizar con SENASA.`,
      );
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'No se pudo asociar el RENAPA.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Asociar RENAPA a ${producer.businessName}`} onClose={onClose}>
      <Notice tone="info">
        Mientras no exista integración con SENASA, el registro queda en estado{' '}
        <strong>pendiente de sincronización</strong> y así lo informa el motor de trazabilidad.
      </Notice>
      <FormFields
        fields={RENAPA_FIELDS}
        values={values}
        onChange={set}
        onSubmit={submit}
        submitLabel="Asociar RENAPA"
        onCancel={onClose}
        busy={busy}
        error={error}
      />
    </Modal>
  );
};
