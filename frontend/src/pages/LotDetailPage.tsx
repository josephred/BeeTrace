import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, apiSend } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useResource } from '../lib/useResource';
import { formatDate, formatDateTime, formatQuantity, humanize, toLocalInput } from '../lib/format';
import {
  Badge,
  Card,
  Empty,
  FormFields,
  Modal,
  Notice,
  Spinner,
  Stat,
  StatusBadge,
  useForm,
  type FieldSpec,
} from '../components/ui';
import type { Lot, TimelineEvent } from '../lib/types';

const SOURCE_LABEL: Record<string, string> = {
  MOVEMENT: 'Movimiento',
  LOT: 'Lote previo',
  EXTRACTION: 'Extracción',
  MANUAL: 'Carga manual',
};

export const LotDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { canWrite } = useAuth();
  const [addingDrum, setAddingDrum] = useState(false);
  const [addingSample, setAddingSample] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const lot = useResource<Lot>(id ? `/lots/${id}` : null);
  const timeline = useResource<{ events: TimelineEvent[] }>(
    id ? `/traceability/timeline/lot/${id}` : null,
  );

  if (lot.loading) return <Spinner label="Cargando lote…" />;
  if (lot.error) return <Notice tone="danger">{lot.error}</Notice>;
  if (!lot.data) return null;

  const data = lot.data;
  const summary = data.summary;
  const drumCoverage =
    summary && summary.quantity > 0
      ? Math.round((summary.netWeightInDrums / summary.quantity) * 100)
      : 0;

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <div className="row">
            <h1 className="mono">{data.code}</h1>
            <StatusBadge status={data.status} />
            <Badge tone="accent">{humanize(data.lotType)}</Badge>
          </div>
          <p className="lead">
            {data.honeyType ?? 'Sin clasificar'} · producido el {formatDate(data.productionDate)}
          </p>
        </div>
        <div className="row">
          <Link className="btn" to={`/trace/backward/lot/${data.id}`}>
            ¿De dónde vino?
          </Link>
          <Link className="btn" to={`/trace/forward/lot/${data.id}`}>
            ¿Dónde terminó?
          </Link>
        </div>
      </div>

      {flash && <Notice tone="ok">{flash}</Notice>}

      {data.inputs && data.inputs.length === 0 && (
        <Notice tone="warn">
          Este lote no declara entradas: su origen no puede reconstruirse. La consulta de
          trazabilidad lo reportará como hueco.
        </Notice>
      )}

      <div className="grid cols-4">
        <Stat label="Cantidad" value={formatQuantity(data.quantity, data.unit)} />
        <Stat
          label="Disponible"
          value={formatQuantity(data.availableQuantity, data.unit)}
          hint="lo no consumido por otros lotes"
        />
        <Stat
          label="Tambores"
          value={summary?.drumCount ?? 0}
          hint={`${formatQuantity(summary?.netWeightInDrums, data.unit)} · ${drumCoverage}% del lote`}
        />
        <Stat label="Humedad" value={data.moisturePercent ? `${data.moisturePercent} %` : '—'} />
      </div>

      <div className="grid cols-2">
        <Card
          title="Composición"
          actions={<span className="small muted">De qué se compone este lote</span>}
        >
          {data.inputs && data.inputs.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Origen</th>
                    <th className="num">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inputs.map((input) => (
                    <tr key={input.id}>
                      <td>
                        <Badge tone="info">{SOURCE_LABEL[input.sourceType] ?? input.sourceType}</Badge>
                        {input.sourceLotId && (
                          <Link className="small" to={`/lots/${input.sourceLotId}`}>
                            {' '}
                            ver lote origen
                          </Link>
                        )}
                        {input.sourceMovementId && (
                          <Link className="small" to={`/movements/${input.sourceMovementId}`}>
                            {' '}
                            ver movimiento
                          </Link>
                        )}
                      </td>
                      <td className="num">{formatQuantity(input.quantity, input.unit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted small">Sin entradas declaradas.</p>
          )}
        </Card>

        <Card
          title="Tambores"
          actions={
            canWrite && (
              <button type="button" className="small primary" onClick={() => setAddingDrum(true)}>
                Registrar tambor
              </button>
            )
          }
        >
          {data.drums && data.drums.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th className="num">Neto</th>
                    <th>Precinto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.drums.map((drum) => (
                    <tr key={drum.id}>
                      <td className="mono">{drum.code}</td>
                      <td className="num">{formatQuantity(drum.netWeight, drum.unit)}</td>
                      <td className="small mono">{drum.sealNumber ?? '—'}</td>
                      <td>
                        <StatusBadge status={drum.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="Sin tambores"
              description="El tambor es la unidad física; la suma de sus pesos netos no puede superar la cantidad del lote."
            />
          )}
        </Card>
      </div>

      <Card
        title="Historial"
        actions={
          canWrite && (
            <button type="button" className="small" onClick={() => setAddingSample(true)}>
              Registrar muestra
            </button>
          )
        }
      >
        {timeline.data && timeline.data.events.length > 0 ? (
          <ul className="timeline">
            {timeline.data.events.map((event) => (
              <li key={event.id}>
                <strong>{event.eventType}</strong>
                <div className="when">Registrado {formatDateTime(event.recordedAt)}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">Sin eventos registrados.</p>
        )}
      </Card>

      {addingDrum && (
        <DrumModal
          lot={data}
          onClose={() => setAddingDrum(false)}
          onDone={(message) => {
            setAddingDrum(false);
            setFlash(message);
            lot.reload();
            timeline.reload();
          }}
        />
      )}

      {addingSample && (
        <SampleModal
          lot={data}
          onClose={() => setAddingSample(false)}
          onDone={(message) => {
            setAddingSample(false);
            setFlash(message);
            timeline.reload();
          }}
        />
      )}
    </div>
  );
};

const DrumModal = ({
  lot,
  onClose,
  onDone,
}: {
  lot: Lot;
  onClose: () => void;
  onDone: (message: string) => void;
}) => {
  const remaining =
    Number(lot.quantity) - (lot.summary?.netWeightInDrums ?? 0);

  const fields: FieldSpec[] = [
    { name: 'code', label: 'Código', help: 'Si se omite, se genera automáticamente.' },
    { name: 'netWeight', label: 'Peso neto (kg)', type: 'number', step: '0.001', required: true },
    { name: 'tareWeight', label: 'Tara (kg)', type: 'number', step: '0.001' },
    { name: 'grossWeight', label: 'Bruto (kg)', type: 'number', step: '0.001' },
    { name: 'sealNumber', label: 'Precinto' },
    { name: 'filledAt', label: 'Fecha de llenado', type: 'datetime-local', defaultValue: toLocalInput() },
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
        body[key] = /Weight$/.test(key)
          ? Number(value)
          : key === 'filledAt'
            ? new Date(value).toISOString()
            : value;
      }
      const result = await apiSend('POST', `/lots/${lot.id}/drums`, body, {
        label: `Tambor de ${values.netWeight} kg en ${lot.code}`,
        entity: '/lots',
      });
      onDone(
        result.queued ? 'Sin conexión: el tambor quedó en la cola.' : 'Tambor registrado.',
      );
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'No se pudo registrar el tambor.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Registrar tambor en ${lot.code}`} onClose={onClose}>
      <Notice tone="info">
        Quedan <strong>{formatQuantity(remaining, lot.unit)}</strong> del lote sin envasar. Si el
        peso bruto y la tara están cargados, el neto debe coincidir con su diferencia.
      </Notice>
      <FormFields
        fields={fields}
        values={values}
        onChange={set}
        onSubmit={submit}
        submitLabel="Registrar tambor"
        onCancel={onClose}
        busy={busy}
        error={error}
      />
    </Modal>
  );
};

const SampleModal = ({
  lot,
  onClose,
  onDone,
}: {
  lot: Lot;
  onClose: () => void;
  onDone: (message: string) => void;
}) => {
  const fields: FieldSpec[] = [
    { name: 'takenAt', label: 'Fecha de toma', type: 'datetime-local', required: true, defaultValue: toLocalInput() },
    { name: 'takenBy', label: 'Tomada por' },
    { name: 'analysisType', label: 'Análisis solicitado', full: true, placeholder: 'HMF, humedad y conductividad' },
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
      const body: Record<string, unknown> = { lotId: lot.id };
      for (const [key, value] of Object.entries(values)) {
        if (value === '') continue;
        body[key] = key === 'takenAt' ? new Date(value).toISOString() : value;
      }
      const result = await apiSend('POST', '/samples', body, {
        label: `Muestra del lote ${lot.code}`,
        entity: '/lots',
      });
      onDone(result.queued ? 'Sin conexión: la muestra quedó en la cola.' : 'Muestra registrada.');
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'No se pudo registrar la muestra.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Registrar muestra del lote ${lot.code}`} onClose={onClose}>
      <FormFields
        fields={fields}
        values={values}
        onChange={set}
        onSubmit={submit}
        submitLabel="Registrar muestra"
        onCancel={onClose}
        busy={busy}
        error={error}
      />
    </Modal>
  );
};
