import { useCallback, useEffect, useState } from 'react';
import { ApiError, NetworkError, apiGet } from './api';

export interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** true cuando el dato viene del almacenamiento local por falta de red. */
  fromCache: boolean;
  cachedAt: number | null;
  reload: () => void;
}

/**
 * Lectura de la API con respaldo local.
 *
 * Distingue tres situaciones que la interfaz debe tratar distinto: dato fresco
 * del servidor, dato viejo del cache (se muestra con advertencia) y ausencia
 * total de dato (se muestra el error). Confundirlas llevaria a presentar
 * informacion desactualizada como si fuera actual, que en trazabilidad es peor
 * que no mostrar nada.
 */
export const useResource = <T>(path: string | null, deps: unknown[] = []): ResourceState<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!path) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    apiGet<T>(path)
      .then((result) => {
        if (cancelled) return;
        setData(result.data);
        setFromCache(result.fromCache);
        setCachedAt(result.cachedAt ?? null);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (cause instanceof NetworkError) {
          setError('Sin conexión y sin copia local de estos datos.');
        } else if (cause instanceof ApiError) {
          setError(cause.message);
        } else {
          setError('Ocurrió un error inesperado.');
        }
        setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, nonce, ...deps]);

  return { data, loading, error, fromCache, cachedAt, reload };
};
