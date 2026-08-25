import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setOnline } from '../test-setup';
import { ApiError, apiGet, apiSend, setTokens } from './api';
import {
  clearCache,
  clearOutbox,
  enqueue,
  invalidateCache,
  listOutbox,
  putCache,
  readCache,
} from './db';
import { flushOutbox } from './outbox';

/** Respuesta HTTP simulada, con las cabeceras que la capa de red consulta. */
const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const networkFailure = () => Promise.reject(new TypeError('Failed to fetch'));

describe('capa offline', () => {
  beforeEach(async () => {
    await clearCache();
    await clearOutbox();
    setOnline(true);
    setTokens({ accessToken: 'token-de-prueba', refreshToken: 'refresh-de-prueba' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('almacenamiento local', () => {
    it('guarda y recupera una respuesta cacheada', async () => {
      await putCache('/lots', { data: [{ code: 'LOTE-2026-000001' }] });
      const cached = await readCache<{ data: { code: string }[] }>('/lots');
      expect(cached?.data.data[0].code).toBe('LOTE-2026-000001');
      expect(cached?.cachedAt).toBeGreaterThan(0);
    });

    it('invalida por prefijo, para que un alta caduque todos sus listados', async () => {
      await putCache('/movements', { data: [] });
      await putCache('/movements?status=DRAFT', { data: [] });
      await putCache('/lots', { data: [] });

      await invalidateCache('/movements');

      expect(await readCache('/movements')).toBeNull();
      expect(await readCache('/movements?status=DRAFT')).toBeNull();
      // El cache de otra entidad no debe verse afectado.
      expect(await readCache('/lots')).not.toBeNull();
    });
  });

  describe('lecturas', () => {
    it('trae del servidor y deja copia local', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(jsonResponse({ data: [{ id: '1' }] })),
      );

      const result = await apiGet<{ data: { id: string }[] }>('/lots');
      expect(result.fromCache).toBe(false);
      expect(result.data.data).toHaveLength(1);
      expect(await readCache('/lots')).not.toBeNull();
    });

    it('cae a la copia local cuando no hay red, y lo informa', async () => {
      await putCache('/lots', { data: [{ id: 'cacheado' }] });
      vi.stubGlobal('fetch', vi.fn().mockImplementation(networkFailure));

      const result = await apiGet<{ data: { id: string }[] }>('/lots');
      expect(result.fromCache).toBe(true);
      expect(result.data.data[0].id).toBe('cacheado');
      expect(result.cachedAt).toBeGreaterThan(0);
    });

    it('falla si no hay red ni copia local: no inventa datos', async () => {
      vi.stubGlobal('fetch', vi.fn().mockImplementation(networkFailure));
      await expect(apiGet('/lots')).rejects.toThrow();
    });

    it('un error del servidor no se enmascara con el cache', async () => {
      await putCache('/lots', { data: [{ id: 'viejo' }] });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ message: 'Prohibido' }, 403)));

      // Un 403 significa que el usuario no debe ver esto: devolver el cache
      // seria mostrarle datos a los que ya no tiene acceso.
      await expect(apiGet('/lots')).rejects.toBeInstanceOf(ApiError);
    });
  });

  describe('escrituras', () => {
    it('encola cuando el dispositivo esta sin conexion', async () => {
      setOnline(false);
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);

      const result = await apiSend('POST', '/movements', { quantity: 100 }, {
        label: 'Movimiento de prueba',
        entity: '/movements',
      });

      expect(result.queued).toBe(true);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(await listOutbox()).toHaveLength(1);
    });

    it('encola si la peticion sale pero la red falla a mitad de camino', async () => {
      vi.stubGlobal('fetch', vi.fn().mockImplementation(networkFailure));

      const result = await apiSend('POST', '/movements', { quantity: 100 }, {
        label: 'Movimiento de prueba',
        entity: '/movements',
      });

      expect(result.queued).toBe(true);
      expect(await listOutbox()).toHaveLength(1);
    });

    it('envia una clave de idempotencia en cada escritura', async () => {
      const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({ id: 'creado' }, 201));
      vi.stubGlobal('fetch', fetchSpy);

      await apiSend('POST', '/movements', { quantity: 100 }, {
        label: 'Movimiento',
        entity: '/movements',
      });

      const headers = fetchSpy.mock.calls[0][1].headers as Record<string, string>;
      expect(headers['Idempotency-Key']).toMatch(/^[0-9a-f-]{8,}/i);
    });

    it('un error de validacion no se encola: reintentarlo daria lo mismo', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(jsonResponse({ message: 'Cantidad inválida' }, 400)),
      );

      await expect(
        apiSend('POST', '/movements', { quantity: -1 }, {
          label: 'Movimiento inválido',
          entity: '/movements',
        }),
      ).rejects.toBeInstanceOf(ApiError);

      expect(await listOutbox()).toHaveLength(0);
    });
  });

  describe('sincronizacion de la cola', () => {
    const encolar = (label: string) =>
      enqueue({
        method: 'POST',
        path: '/movements',
        body: { label },
        idempotencyKey: `clave-${label}`,
        label,
        entity: '/movements',
      });

    it('reenvia con la MISMA clave de idempotencia con la que se encolo', async () => {
      const item = await encolar('primero');
      const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({ id: 'ok' }, 201));
      vi.stubGlobal('fetch', fetchSpy);

      await flushOutbox(() => true);

      const headers = fetchSpy.mock.calls[0][1].headers as Record<string, string>;
      // Esta es la garantia central: si el envio original llego al servidor y solo
      // se perdio la respuesta, el reintento no crea un segundo movimiento.
      expect(headers['Idempotency-Key']).toBe(item.idempotencyKey);
    });

    it('envia en el orden en que se registraron las operaciones', async () => {
      await encolar('primero');
      await new Promise((resolve) => setTimeout(resolve, 2));
      await encolar('segundo');
      await new Promise((resolve) => setTimeout(resolve, 2));
      await encolar('tercero');

      const enviados: string[] = [];
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((_url: string, init: RequestInit) => {
          enviados.push(JSON.parse(init.body as string).label);
          return Promise.resolve(jsonResponse({ id: 'ok' }, 201));
        }),
      );

      const result = await flushOutbox(() => true);

      expect(result.sent).toBe(3);
      expect(enviados).toEqual(['primero', 'segundo', 'tercero']);
      expect(await listOutbox()).toHaveLength(0);
    });

    it('se detiene ante un corte de red y conserva el resto en espera', async () => {
      await encolar('primero');
      await new Promise((resolve) => setTimeout(resolve, 2));
      await encolar('segundo');
      await new Promise((resolve) => setTimeout(resolve, 2));
      await encolar('tercero');

      let llamadas = 0;
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(() => {
          llamadas += 1;
          if (llamadas === 1) return Promise.resolve(jsonResponse({ id: 'ok' }, 201));
          return networkFailure();
        }),
      );

      const result = await flushOutbox(() => true);

      expect(result.sent).toBe(1);
      expect(result.stopped).toBe(true);
      // No se gastan intentos del tercero por un problema que es de conexion.
      expect(llamadas).toBe(2);

      const restantes = await listOutbox();
      expect(restantes).toHaveLength(2);
      expect(restantes.every((item) => item.status === 'PENDING')).toBe(true);
    });

    it('marca como rechazada la operacion que el servidor invalida, y sigue con la siguiente', async () => {
      await encolar('invalida');
      await new Promise((resolve) => setTimeout(resolve, 2));
      await encolar('valida');

      let llamadas = 0;
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(() => {
          llamadas += 1;
          return Promise.resolve(
            llamadas === 1
              ? jsonResponse({ message: 'Origen y destino no pueden coincidir.' }, 400)
              : jsonResponse({ id: 'ok' }, 201),
          );
        }),
      );

      const result = await flushOutbox(() => true);

      expect(result.failed).toBe(1);
      expect(result.sent).toBe(1);

      const restantes = await listOutbox();
      expect(restantes).toHaveLength(1);
      expect(restantes[0].status).toBe('FAILED');
      expect(restantes[0].lastError).toContain('400');
    });

    it('no intenta nada si el dispositivo esta sin conexion', async () => {
      await encolar('primero');
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);

      const result = await flushOutbox(() => false);

      expect(result.stopped).toBe(true);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(await listOutbox()).toHaveLength(1);
    });
  });
});
