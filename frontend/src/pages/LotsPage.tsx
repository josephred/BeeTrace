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
import type { Establishment, Extraction, Lot, Paginated } from '../lib/types';

export const LotsPage = () => {
  const { canWrite } = useAuth();
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const list = useResource<Paginated<Lot>>(
    `/lots?pageSize=50${status ? `&status=${status}` : ''}`,
  );
  const establishments = useResource<Paginated<Establishment>>('/establishments?pageSize=100');
  const extractions = useResource<Paginated<Extraction>>('/extractions?pageSize=100');
  const sourceLots = useResource<Paginated<Lot>>('/lots?pageSize=100&status=OPEN');

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Lotes</h1>
          <p className="lead">
            El lote es la unidad lógica de trazabilidad. Sus entradas definen de qué se compone y
            son la arista que permite reconstruir el origen.
          </p>
        </div>
        {canWrite && (
          <button type="button" className="primary" onClick={() => setCreating(true)}>
            Nuevo lote
          </button>
        )}
      </div>

      {flash && <Notice tone="ok">{flash}</Notice>}
      {list.error && <Notice tone="danger">{list.error}</Notice>}

      <div className="toolbar">
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Estado">
          <option value="">Todos los estados</option>
          {['OPEN', 'CLOSED', 'BLOCKED', 'DISPATCHED', 'CONSUMED'].map((option) => (
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
                  <th>Tipo</th>
                  <th>Producción</th>
                  <th className="num">Cantidad</th>
                  <th className="num">Disponible</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.data.data.map((lot) => (
                  <tr key={lot.id}>
                    <td className="mono">
                      <Link to={`/lots/${lot.id}`}>
                        <strong>{lot.code}</strong>
                      </Link>
                    </td>
                    <td>{humanize(lot.lotType)}</td>
                    <td className="small nowrap">{formatDate(lot.productionDate)}</td>
                    <td className="num">{formatQuantity(lot.quantity, lot.unit)}</td>
                    <td className="num">{formatQuantity(lot.availableQuantity, lot.unit)}</td>
                    <td>
                      <StatusBadge status={lot.status} />
                    </td>
                    <td>
                      <Link className="btn small" to={`/trace/backward/lot/${lot.id}`}>
                        ¿De dónde vino?
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !list.loading && (
            <Empty
              title="Sin lotes"
              description="Un lote nace de una extracción o del acopio de otros lotes."
            />
          )
        )}
      </Card>

      {creating && (
        <CreateLotModal
          establishments={establishments.data?.data ?? []}
          extractions={(extractions.data?.data ?? []).filter((e) => e.status === 'COMPLETED')}
          sourceLots={sourceLots.data?.data ?? []}
          onClose={() => setCreating(false)}
          onDone={(message) => {
            setCreating(false);
            setFlash(message);
            list.reload();
          }}
        />
      )}
    </div>
  );
};

const CreateLotModal = ({
  establishments,
  extractions,
  sourceLots,
  onClose,
  onDone,
}: {
  establishments: Establishment[];
  extractions: Extraction[];
  sourceLots: Lot[];
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
    {
      name: 'lotType',
      label: 'Tipo de lote',
      type: 'select',
      required: true,
      defaultValue: 'EXTRACCION',
      options: [
        { value: 'EXTRACCION', label: 'De extracción' },
        { value: 'ACOPIO', label: 'De acopio' },
        { value: 'MEZCLA', label: 'De mezcla' },
        { value: 'FRACCIONAMIENTO', label: 'De fraccionamiento' },
      ],
    },
    {
      name: 'productionDate',
      label: 'Fecha de producción',
      type: 'datetime-local',
      required: true,
      defaultValue: toLocalInput(),
    },
    { name: 'quantity', label: 'Cantidad', type: 'number', step: '0.001', required: true },
    {
      name: 'unit',
      label: 'Unidad',
      type: 'select',
      defaultValue: 'KG',
      options: ['KG', 'LITRO', 'TAMBOR'].map((u) => ({ value: u, label: u })),
    },
    { name: 'honeyType', label: 'Tipo de miel', placeholder: 'Multifloral' },
    { name: 'moisturePercent', label: 'Humedad (%)', type: 'number', step: '0.01' },
    { name: 'color', label: 'Color', placeholder: 'Ámbar claro' },
  ];

  const { values, set } = useForm(fields);
  const [extractionId, setExtractionId] = useState('');
  const [sourceLotId, setSourceLotId] = useState('');
  const [sourceLotQuantity, setSourceLotQuantity] = useState('');
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
        body[key] =
          key === 'quantity' || key === 'moisturePercent'
            ? Number(value)
            : key === 'productionDate'
              ? new Date(value).toISOString()
              : value;
      }
      if (extractionId) body.extractionId = extractionId;
      if (sourceLotId) {
        body.inputs = [
          {
            sourceType: 'LOT',
            sourceLotId,
            quantity: Number(sourceLotQuantity || values.quantity),
            unit: values.unit || 'KG',
          },
        ];
      }

      const result = await apiSend<Lot>('POST', '/lots', body, {
        label: `Lote de ${values.quantity} ${values.unit}`,
        entity: '/lots',
      });
      onDone(
        result.queued
          ? 'Sin conexión: el lote quedó en la cola.'
          : `Lote ${result.data.code} creado.`,
      );
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'No se pudo crear el lote.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Nuevo lote" onClose={onClose}>
      <Notice tone="info">
        Un lote sin origen declarado queda sin trazabilidad hacia atrás, y el sistema lo reporta
        como hueco. Indicá la extracción o el lote del que proviene.
      </Notice>
      <FormFields
        fields={fields}
        values={values}
        onChange={set}
        onSubmit={submit}
        submitLabel="Crear lote"
        onCancel={onClose}
        busy={busy}
        error={error}
      >
        <div className="form-row">
          <div className="field">
            <label htmlFor="extractionId">Origen: extracción</label>
            <select
              id="extractionId"
              value={extractionId}
              onChange={(event) => {
                setExtractionId(event.target.value);
                if (event.target.value) setSourceLotId('');
              }}
            >
              <option value="">— Ninguna —</option>
              {extractions.map((extraction) => (
                <option key={extraction.id} value={extraction.id}>
                  {extraction.code} ({formatQuantity(extraction.outputQuantity, extraction.unit)})
                </option>
              ))}
            </select>
            <span className="help">La arista hacia la extracción se agrega sola.</span>
          </div>

          <div className="field">
            <label htmlFor="sourceLotId">Origen: otro lote</label>
            <select
              id="sourceLotId"
              value={sourceLotId}
              onChange={(event) => {
                setSourceLotId(event.target.value);
                if (event.target.value) setExtractionId('');
              }}
            >
              <option value="">— Ninguno —</option>
              {sourceLots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.code} (disp. {formatQuantity(lot.availableQuantity, lot.unit)})
                </option>
              ))}
            </select>
          </div>

          {sourceLotId && (
            <div className="field">
              <label htmlFor="sourceLotQuantity">Cantidad a consumir del lote origen</label>
              <input
                id="sourceLotQuantity"
                type="number"
                step="0.001"
                value={sourceLotQuantity}
                onChange={(event) => setSourceLotQuantity(event.target.value)}
                placeholder={values.quantity}
              />
              <span className="help">Se descuenta de su disponibilidad.</span>
            </div>
          )}
        </div>
      </FormFields>
    </Modal>
  );
};
