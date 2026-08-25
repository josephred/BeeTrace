import { useState, type FormEvent } from 'react';
import { ApiError, apiSend } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useResource } from '../lib/useResource';
import { formatDateTime, formatQuantity, humanize, toLocalInput } from '../lib/format';
import {
  Card,
  Empty,
  Modal,
  Notice,
  Spinner,
  StatusBadge,
  type FieldSpec,
} from '../components/ui';
import type { Establishment, Extraction, Movement, Paginated } from '../lib/types';

export const ExtractionsPage = () => {
  const { canWrite } = useAuth();
  const [creating, setCreating] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const list = useResource<Paginated<Extraction>>('/extractions?pageSize=50');
  const salas = useResource<Paginated<Establishment>>(
    '/establishments?pageSize=100&type=SALA_EXTRACCION',
  );

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Extracciones</h1>
          <p className="lead">
            La extracción consume los movimientos recibidos en la sala y los convierte en miel
            loteada. Un movimiento no puede alimentar dos extracciones distintas.
          </p>
        </div>
        {canWrite && (
          <button type="button" className="primary" onClick={() => setCreating(true)}>
            Nueva extracción
          </button>
        )}
      </div>

      {flash && <Notice tone="ok">{flash}</Notice>}
      {list.error && <Notice tone="danger">{list.error}</Notice>}
      {list.loading && <Spinner />}

      <Card tight>
        {list.data && list.data.data.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Inicio</th>
                  <th className="num">Ingresado</th>
                  <th className="num">Obtenido</th>
                  <th className="num">Rendimiento</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {list.data.data.map((extraction) => {
                  const input = Number(extraction.inputQuantity);
                  const output = extraction.outputQuantity
                    ? Number(extraction.outputQuantity)
                    : null;
                  return (
                    <tr key={extraction.id}>
                      <td className="mono">
                        <strong>{extraction.code}</strong>
                      </td>
                      <td className="small nowrap">{formatDateTime(extraction.startedAt)}</td>
                      <td className="num">
                        {formatQuantity(extraction.inputQuantity, extraction.unit)}
                      </td>
                      <td className="num">
                        {formatQuantity(extraction.outputQuantity, extraction.unit)}
                      </td>
                      <td className="num">
                        {output && input ? `${((output / input) * 100).toFixed(1)} %` : '—'}
                      </td>
                      <td>
                        <StatusBadge status={extraction.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          !list.loading && (
            <Empty
              title="Sin extracciones"
              description="Primero hay que recibir un movimiento en la sala; recién entonces puede procesarse."
            />
          )
        )}
      </Card>

      {creating && (
        <CreateExtractionModal
          salas={salas.data?.data ?? []}
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

const CreateExtractionModal = ({
  salas,
  onClose,
  onDone,
}: {
  salas: Establishment[];
  onClose: () => void;
  onDone: (message: string) => void;
}) => {
  const [establishmentId, setEstablishmentId] = useState(salas[0]?.id ?? '');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [startedAt, setStartedAt] = useState(toLocalInput());
  const [finishedAt, setFinishedAt] = useState('');
  const [outputQuantity, setOutputQuantity] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Solo se ofrecen los movimientos ya recibidos y no consumidos por otra extracción. */
  const available = useResource<Movement[]>(
    establishmentId ? `/lots/available-inputs/${establishmentId}` : null,
  );

  const chosen = (available.data ?? []).filter((movement) => selected[movement.id]);
  const totalInput = chosen.reduce((sum, movement) => sum + Number(movement.quantity), 0);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (chosen.length === 0) {
      setError('Seleccione al menos un movimiento recibido para procesar.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        establishmentId,
        startedAt: new Date(startedAt).toISOString(),
        inputs: chosen.map((movement) => ({
          movementId: movement.id,
          quantity: Number(movement.quantity),
          unit: movement.unit,
        })),
      };
      if (finishedAt) body.finishedAt = new Date(finishedAt).toISOString();
      if (outputQuantity) body.outputQuantity = Number(outputQuantity);
      if (operatorName) body.operatorName = operatorName;

      const result = await apiSend<Extraction>('POST', '/extractions', body, {
        label: `Extracción de ${chosen.length} movimiento(s)`,
        entity: '/extractions',
      });
      onDone(
        result.queued
          ? 'Sin conexión: la extracción quedó en la cola.'
          : `Extracción ${result.data.code} registrada.`,
      );
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'No se pudo registrar la extracción.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Nueva extracción" onClose={onClose}>
      {error && <Notice tone="danger">{error}</Notice>}
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="sala">Sala de extracción</label>
          <select
            id="sala"
            required
            value={establishmentId}
            onChange={(event) => {
              setEstablishmentId(event.target.value);
              setSelected({});
            }}
          >
            <option value="">— Seleccionar —</option>
            {salas.map((sala) => (
              <option key={sala.id} value={sala.id}>
                {sala.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Movimientos recibidos a procesar</label>
          {available.loading && <Spinner />}
          {available.data && available.data.length === 0 && (
            <p className="muted small">
              No hay movimientos recibidos sin procesar en esta sala. Registrá primero la recepción
              de un movimiento.
            </p>
          )}
          {available.data && available.data.length > 0 && (
            <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '2rem' }} />
                    <th>Movimiento</th>
                    <th>Material</th>
                    <th className="num">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {available.data.map((movement) => (
                    <tr key={movement.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={Boolean(selected[movement.id])}
                          onChange={(event) =>
                            setSelected((current) => ({
                              ...current,
                              [movement.id]: event.target.checked,
                            }))
                          }
                          aria-label={`Seleccionar ${movement.code}`}
                        />
                      </td>
                      <td className="mono">{movement.code}</td>
                      <td className="small">{humanize(movement.materialType)}</td>
                      <td className="num">{formatQuantity(movement.quantity, movement.unit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {chosen.length > 0 && (
            <span className="help">
              {chosen.length} seleccionado(s) · {formatQuantity(totalInput, 'KG')} a procesar
            </span>
          )}
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="startedAt">Inicio</label>
            <input
              id="startedAt"
              type="datetime-local"
              required
              value={startedAt}
              onChange={(event) => setStartedAt(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="finishedAt">Fin</label>
            <input
              id="finishedAt"
              type="datetime-local"
              value={finishedAt}
              onChange={(event) => setFinishedAt(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="output">Miel obtenida (kg)</label>
            <input
              id="output"
              type="number"
              step="0.001"
              value={outputQuantity}
              onChange={(event) => setOutputQuantity(event.target.value)}
            />
            <span className="help">No puede superar lo ingresado.</span>
          </div>
          <div className="field">
            <label htmlFor="operator">Operario</label>
            <input
              id="operator"
              value={operatorName}
              onChange={(event) => setOperatorName(event.target.value)}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="submit" className="primary" disabled={busy || chosen.length === 0}>
            {busy && <span className="spinner" aria-hidden="true" />}
            Registrar extracción
          </button>
        </div>
      </form>
    </Modal>
  );
};

export type { FieldSpec };
