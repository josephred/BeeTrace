import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, apiSend } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useResource } from '../lib/useResource';
import { formatRelative } from '../lib/format';
import {
  Badge,
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
import type { Apiary, Establishment, Hive, Paginated } from '../lib/types';

export const ApiariesPage = () => {
  const { canWrite } = useAuth();
  const [creating, setCreating] = useState(false);
  const [hivesFor, setHivesFor] = useState<Apiary | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const list = useResource<Paginated<Apiary>>('/apiaries?pageSize=100');
  const establishments = useResource<Paginated<Establishment>>(
    '/establishments?pageSize=100&type=APIARIO_BASE',
  );

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Apiarios</h1>
          <p className="lead">
            Unidad productiva donde están las colmenas. Pertenece a un establecimiento y es el punto
            de partida real de la trazabilidad hacia adelante.
          </p>
        </div>
        {canWrite && (
          <button type="button" className="primary" onClick={() => setCreating(true)}>
            Nuevo apiario
          </button>
        )}
      </div>

      {flash && <Notice tone="ok">{flash}</Notice>}
      {list.fromCache && (
        <Notice tone="warn">
          Datos locales guardados {formatRelative(list.cachedAt)}. Podés seguir consultando y
          registrando: lo nuevo se envía al recuperar señal.
        </Notice>
      )}
      {list.error && <Notice tone="danger">{list.error}</Notice>}
      {list.loading && <Spinner />}

      <Card tight>
        {list.data && list.data.data.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Establecimiento</th>
                  <th className="num">Colmenas</th>
                  <th>Coordenadas</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.data.data.map((apiary) => (
                  <tr key={apiary.id}>
                    <td className="mono">
                      <strong>{apiary.code}</strong>
                    </td>
                    <td>{apiary.name ?? '—'}</td>
                    <td className="small muted">{apiary.establishmentName ?? '—'}</td>
                    <td className="num">{apiary.hiveCount}</td>
                    <td className="small mono">
                      {apiary.latitude && apiary.longitude
                        ? `${Number(apiary.latitude).toFixed(4)}, ${Number(apiary.longitude).toFixed(4)}`
                        : '—'}
                    </td>
                    <td>
                      <StatusBadge status={apiary.status} />
                    </td>
                    <td>
                      <div className="row">
                        {canWrite && (
                          <button type="button" className="small" onClick={() => setHivesFor(apiary)}>
                            Colmenas
                          </button>
                        )}
                        <Link className="btn small" to={`/trace/forward/apiary/${apiary.id}`}>
                          ¿Dónde terminó?
                        </Link>
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
              title="Sin apiarios"
              description="Registrá primero un establecimiento de tipo predio apícola y luego el apiario que contiene."
            />
          )
        )}
      </Card>

      {creating && (
        <CreateApiaryModal
          establishments={establishments.data?.data ?? []}
          onClose={() => setCreating(false)}
          onDone={(message) => {
            setCreating(false);
            setFlash(message);
            list.reload();
          }}
        />
      )}

      {hivesFor && (
        <HivesModal
          apiary={hivesFor}
          onClose={() => {
            setHivesFor(null);
            list.reload();
          }}
        />
      )}
    </div>
  );
};

const CreateApiaryModal = ({
  establishments,
  onClose,
  onDone,
}: {
  establishments: Establishment[];
  onClose: () => void;
  onDone: (message: string) => void;
}) => {
  const fields: FieldSpec[] = [
    {
      name: 'establishmentId',
      label: 'Establecimiento',
      type: 'select',
      required: true,
      full: true,
      options: establishments.map((e) => ({ value: e.id, label: e.name })),
    },
    { name: 'code', label: 'Código', required: true, placeholder: 'API-001' },
    { name: 'name', label: 'Nombre' },
    { name: 'latitude', label: 'Latitud', type: 'number', step: 'any' },
    { name: 'longitude', label: 'Longitud', type: 'number', step: 'any' },
    { name: 'locality', label: 'Localidad' },
    { name: 'province', label: 'Provincia' },
  ];

  const { values, set, setValues } = useForm(fields);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  /** Tomar la posición del dispositivo es lo natural estando parado en el apiario. */
  const useCurrentPosition = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValues((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

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
      const result = await apiSend<Apiary>('POST', '/apiaries', body, {
        label: `Apiario ${values.code}`,
        entity: '/apiaries',
      });
      onDone(
        result.queued
          ? 'Sin conexión: el apiario quedó en la cola y se enviará al recuperar señal.'
          : `Apiario ${result.data.code} registrado.`,
      );
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'No se pudo registrar el apiario.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Nuevo apiario" onClose={onClose}>
      <FormFields
        fields={fields}
        values={values}
        onChange={set}
        onSubmit={submit}
        submitLabel="Registrar apiario"
        onCancel={onClose}
        busy={busy}
        error={error}
      >
        <button type="button" className="small" onClick={useCurrentPosition} disabled={locating}>
          {locating && <span className="spinner" aria-hidden="true" />}
          Usar mi ubicación actual
        </button>
      </FormFields>
    </Modal>
  );
};

const HivesModal = ({ apiary, onClose }: { apiary: Apiary; onClose: () => void }) => {
  const hives = useResource<Hive[]>(`/apiaries/${apiary.id}/hives`);
  const [code, setCode] = useState('');
  const [type, setType] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queued, setQueued] = useState(0);

  const addHive = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await apiSend('POST', `/apiaries/${apiary.id}/hives`, {
        code,
        ...(type ? { type } : {}),
      }, {
        label: `Colmena ${code} en ${apiary.code}`,
        entity: '/apiaries',
      });
      setCode('');
      if (result.queued) setQueued((n) => n + 1);
      else hives.reload();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'No se pudo registrar la colmena.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Colmenas de ${apiary.code}`} onClose={onClose}>
      {error && <Notice tone="danger">{error}</Notice>}
      {queued > 0 && (
        <Notice tone="warn">
          {queued} colmena(s) en la cola de envío. Se registrarán al recuperar la conexión.
        </Notice>
      )}

      <form onSubmit={addHive} className="mb">
        <div className="form-row">
          <div className="field">
            <label htmlFor="hive-code">Código</label>
            <input
              id="hive-code"
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="COL-0001"
            />
          </div>
          <div className="field">
            <label htmlFor="hive-type">Tipo</label>
            <input
              id="hive-type"
              value={type}
              onChange={(event) => setType(event.target.value)}
              placeholder="Langstroth"
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="primary" disabled={busy || !code}>
            {busy && <span className="spinner" aria-hidden="true" />}
            Agregar colmena
          </button>
        </div>
      </form>

      {hives.loading && <Spinner />}
      {hives.data && hives.data.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {hives.data.map((hive) => (
                <tr key={hive.id}>
                  <td className="mono">{hive.code}</td>
                  <td>{hive.type ?? '—'}</td>
                  <td>
                    <Badge tone={hive.status === 'ACTIVE' ? 'ok' : 'neutral'}>{hive.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !hives.loading && <p className="muted small">Todavía no hay colmenas registradas.</p>
      )}
    </Modal>
  );
};
