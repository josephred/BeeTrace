import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, apiSend } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useResource } from '../lib/useResource';
import { formatDateTime, formatQuantity, formatRelative, humanize, toLocalInput } from '../lib/format';
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
import type { Apiary, Establishment, Movement, Paginated } from '../lib/types';

const STATUS_OPTIONS = [
  'DRAFT',
  'DISPATCHED',
  'IN_TRANSIT',
  'RECEIVED',
  'PARTIALLY_RECEIVED',
  'REJECTED',
  'CANCELLED',
];

export const MovementsPage = () => {
  const { canWrite } = useAuth();
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const list = useResource<Paginated<Movement>>(
    `/movements?pageSize=50${status ? `&status=${status}` : ''}`,
  );
  const establishments = useResource<Paginated<Establishment>>('/establishments?pageSize=100');
  const apiaries = useResource<Paginated<Apiary>>('/apiaries?pageSize=100');

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Movimientos</h1>
          <p className="lead">
            El movimiento es el evento de dominio que conecta un origen con un destino. El DT-e es
            un documento asociado, no el movimiento en sí.
          </p>
        </div>
        {canWrite && (
          <button type="button" className="primary" onClick={() => setCreating(true)}>
            Nuevo movimiento
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
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map((option) => (
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
                  <th>Material</th>
                  <th className="num">Cantidad</th>
                  <th>Programado</th>
                  <th>Documento</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {list.data.data.map((movement) => (
                  <tr key={movement.id}>
                    <td className="mono">
                      <Link to={`/movements/${movement.id}`}>
                        <strong>{movement.code}</strong>
                      </Link>
                    </td>
                    <td>{humanize(movement.materialType)}</td>
                    <td className="num">{formatQuantity(movement.quantity, movement.unit)}</td>
                    <td className="small nowrap">{formatDateTime(movement.scheduledAt)}</td>
                    <td>
                      {movement.requiresDocument ? (
                        <Badge tone="warn">Exige {movement.requiredDocumentType}</Badge>
                      ) : (
                        <span className="small faint">No exigido</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={movement.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !list.loading && (
            <Empty
              title="Sin movimientos"
              description="Un movimiento entre el apiario y la sala de extracción es lo que arranca la cadena."
            />
          )
        )}
      </Card>

      {creating && (
        <CreateMovementModal
          establishments={establishments.data?.data ?? []}
          apiaries={apiaries.data?.data ?? []}
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

const CreateMovementModal = ({
  establishments,
  apiaries,
  onClose,
  onDone,
}: {
  establishments: Establishment[];
  apiaries: Apiary[];
  onClose: () => void;
  onDone: (message: string) => void;
}) => {
  const establishmentOptions = establishments.map((e) => ({
    value: e.id,
    label: `${e.name} (${humanize(e.type)})`,
  }));

  const fields: FieldSpec[] = [
    {
      name: 'movementType',
      label: 'Tipo de movimiento',
      type: 'select',
      required: true,
      defaultValue: 'MATERIAL_MELARIO',
      options: [
        { value: 'MATERIAL_MELARIO', label: 'Material melario' },
        { value: 'MIEL_A_GRANEL', label: 'Miel a granel' },
        { value: 'PRODUCTO_FRACCIONADO', label: 'Producto fraccionado' },
        { value: 'MATERIAL_VIVO', label: 'Material vivo' },
        { value: 'MATERIAL_INERTE', label: 'Material inerte' },
        { value: 'OTRO', label: 'Otro' },
      ],
    },
    {
      name: 'materialType',
      label: 'Material',
      type: 'select',
      required: true,
      defaultValue: 'MATERIAL_MELARIO',
      options: [
        { value: 'MATERIAL_MELARIO', label: 'Material melario' },
        { value: 'MIEL', label: 'Miel' },
        { value: 'CERA', label: 'Cera' },
        { value: 'POLEN', label: 'Polen' },
        { value: 'PROPOLEO', label: 'Propóleo' },
        { value: 'JALEA_REAL', label: 'Jalea real' },
        { value: 'NUCLEO', label: 'Núcleo' },
        { value: 'COLMENA', label: 'Colmena' },
        { value: 'OTRO', label: 'Otro' },
      ],
    },
    {
      name: 'originEstablishmentId',
      label: 'Establecimiento de origen',
      type: 'select',
      required: true,
      options: establishmentOptions,
    },
    {
      name: 'originApiaryId',
      label: 'Apiario de origen',
      type: 'select',
      options: apiaries.map((a) => ({ value: a.id, label: `${a.code} — ${a.name ?? ''}` })),
      help: 'Opcional, pero es lo que permite responder de qué apiario vino la miel.',
    },
    {
      name: 'destinationEstablishmentId',
      label: 'Establecimiento de destino',
      type: 'select',
      required: true,
      options: establishmentOptions,
    },
    {
      name: 'scheduledAt',
      label: 'Fecha del traslado',
      type: 'datetime-local',
      required: true,
      defaultValue: toLocalInput(),
      help: 'La exigencia documental se evalúa con esta fecha, no con la de carga.',
    },
    { name: 'quantity', label: 'Cantidad', type: 'number', step: '0.001', required: true },
    {
      name: 'unit',
      label: 'Unidad',
      type: 'select',
      required: true,
      defaultValue: 'KG',
      options: ['KG', 'LITRO', 'ALZA', 'TAMBOR', 'COLMENA', 'UNIDAD'].map((u) => ({
        value: u,
        label: u,
      })),
    },
    { name: 'driverName', label: 'Conductor' },
    { name: 'driverDocument', label: 'Documento del conductor' },
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
        body[key] =
          key === 'quantity'
            ? Number(value)
            : key === 'scheduledAt'
              ? new Date(value).toISOString()
              : value;
      }

      const result = await apiSend<Movement>('POST', '/movements', body, {
        label: `Movimiento ${humanize(values.materialType)} (${values.quantity} ${values.unit})`,
        entity: '/movements',
      });

      if (result.queued) {
        onDone(
          'Sin conexión: el movimiento quedó en la cola. La regla documental se evaluará en el servidor al sincronizar.',
        );
        return;
      }

      const rule = result.data.appliedRule;
      onDone(
        rule?.requiresDocument
          ? `Movimiento ${result.data.code} creado. Requiere ${rule.requiredDocumentType} antes de despachar (${rule.ruleName}).`
          : `Movimiento ${result.data.code} creado.`,
      );
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'No se pudo crear el movimiento.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Nuevo movimiento" onClose={onClose}>
      <Notice tone="info">
        El sistema evalúa la normativa vigente <strong>a la fecha del traslado</strong> y avisa si
        exige DT-e u otro documento. Un traslado anterior al 01/08/2026 no lo requiere.
      </Notice>
      <FormFields
        fields={fields}
        values={values}
        onChange={set}
        onSubmit={submit}
        submitLabel="Crear movimiento"
        onCancel={onClose}
        busy={busy}
        error={error}
      />
    </Modal>
  );
};
