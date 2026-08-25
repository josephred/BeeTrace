import { useSync } from '../lib/sync';
import { formatDateTime, formatRelative } from '../lib/format';
import { Badge, Card, Empty, Notice } from '../components/ui';

const METHOD_TONE = { POST: 'accent', PATCH: 'info', PUT: 'info', DELETE: 'danger' } as const;

export const PendingPage = () => {
  const { online, syncing, pending, lastSyncAt, flush, discard, retry } = useSync();

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Pendientes de sincronizar</h1>
          <p className="lead">
            Operaciones registradas sin conexión. Cada una lleva su clave de idempotencia generada
            en el dispositivo, así que reenviarlas nunca duplica un movimiento ni un DT-e.
          </p>
        </div>
        <button
          type="button"
          className="primary"
          onClick={() => void flush()}
          disabled={!online || syncing || pending.length === 0}
        >
          {syncing && <span className="spinner" aria-hidden="true" />}
          Sincronizar ahora
        </button>
      </div>

      {!online && (
        <Notice tone="warn">
          Sin conexión. La cola se enviará sola en cuanto vuelva la señal.
        </Notice>
      )}

      <Card
        title={`${pending.length} operación(es) en cola`}
        actions={<span className="small muted">Última sincronización {formatRelative(lastSyncAt)}</span>}
        tight
      >
        {pending.length === 0 ? (
          <Empty
            title="No hay nada pendiente"
            description="Todo lo registrado en este dispositivo ya llegó al servidor."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Operación</th>
                  <th>Destino</th>
                  <th>Registrada</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pending.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="row">
                        <Badge tone={METHOD_TONE[item.method]}>{item.method}</Badge>
                        <strong>{item.label}</strong>
                      </div>
                      {item.lastError && (
                        <div className="small" style={{ color: 'var(--danger)' }}>
                          {item.lastError}
                        </div>
                      )}
                    </td>
                    <td className="mono small">{item.path}</td>
                    <td className="small nowrap">{formatDateTime(item.createdAt)}</td>
                    <td>
                      {item.status === 'FAILED' ? (
                        <Badge tone="danger">Rechazada</Badge>
                      ) : item.status === 'SENDING' ? (
                        <Badge tone="info">Enviando</Badge>
                      ) : (
                        <Badge tone="warn">En espera</Badge>
                      )}
                      {item.attempts > 0 && (
                        <span className="small faint"> · {item.attempts} intento(s)</span>
                      )}
                    </td>
                    <td>
                      <div className="row">
                        {item.status === 'FAILED' && (
                          <button
                            type="button"
                            className="small"
                            onClick={() => void retry(item.id)}
                            disabled={!online}
                          >
                            Reintentar
                          </button>
                        )}
                        <button
                          type="button"
                          className="small danger"
                          onClick={() => {
                            if (
                              window.confirm(
                                `¿Descartar «${item.label}»? La operación no se enviará y se perderá.`,
                              )
                            ) {
                              void discard(item.id);
                            }
                          }}
                        >
                          Descartar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Cómo funciona la cola">
        <div className="stack small">
          <p>
            Las operaciones se envían <strong>en el orden en que se registraron</strong>, porque un
            lote puede depender de un movimiento cargado antes.
          </p>
          <p>
            Si se corta la conexión a mitad de la sincronización, el envío se detiene ahí y retoma
            desde el mismo punto: no se queman los intentos del resto de la cola por un problema de
            señal.
          </p>
          <p>
            Una operación rechazada por el servidor con un error de validación (4xx) deja de
            reintentarse sola y queda acá para revisión: reintentarla sin corregirla daría el mismo
            resultado.
          </p>
        </div>
      </Card>
    </div>
  );
};
