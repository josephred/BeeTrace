import { ApiError, NetworkError, replayOutboxItem } from './api';
import { listOutbox, removeOutbox, updateOutbox } from './db';

/** Tras este numero de intentos el elemento deja de reintentarse solo. */
export const MAX_AUTO_ATTEMPTS = 5;

export interface FlushResult {
  sent: number;
  failed: number;
  /** true si el envio se corto por perdida de conexion antes de terminar la cola. */
  stopped: boolean;
}

/**
 * Vacia la cola de escrituras pendientes.
 *
 * Tres decisiones que definen el comportamiento:
 *
 *  1. Se envia en orden de llegada. Un lote puede depender de un movimiento
 *     encolado antes; alterar el orden rompería la cadena de trazabilidad.
 *
 *  2. Ante un fallo de red se corta el recorrido. Seguir intentando con el resto
 *     de la cola solo quemaria intentos cuando el problema es la conexion, no
 *     el contenido de cada operacion.
 *
 *  3. Un 4xx no se reintenta. Es un error de validacion o de permisos: el mismo
 *     pedido volveria a fallar igual, asi que queda marcado para revision manual
 *     en lugar de consumir reintentos en silencio.
 *
 * Se extrajo del proveedor de React para poder probarla de forma aislada: es la
 * pieza de la que depende que nada registrado en el campo se pierda.
 */
export const flushOutbox = async (
  isOnline: () => boolean = () => navigator.onLine,
): Promise<FlushResult> => {
  let sent = 0;
  let failed = 0;
  let stopped = false;

  if (!isOnline()) return { sent, failed, stopped: true };

  const items = await listOutbox();

  for (const item of items) {
    if (item.status === 'DONE') continue;
    if (item.status === 'FAILED' && item.attempts >= MAX_AUTO_ATTEMPTS) continue;

    await updateOutbox(item.id, { status: 'SENDING', lastAttemptAt: Date.now() });

    try {
      await replayOutboxItem(item);
      await removeOutbox(item.id);
      sent += 1;
    } catch (error) {
      if (error instanceof NetworkError) {
        await updateOutbox(item.id, { status: 'PENDING' });
        stopped = true;
        break;
      }

      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        await updateOutbox(item.id, {
          status: 'FAILED',
          attempts: MAX_AUTO_ATTEMPTS,
          lastError: `${error.status} · ${error.message}`,
        });
      } else {
        await updateOutbox(item.id, {
          status: 'FAILED',
          attempts: item.attempts + 1,
          lastError: error instanceof Error ? error.message : String(error),
        });
      }
      failed += 1;
    }
  }

  return { sent, failed, stopped };
};
