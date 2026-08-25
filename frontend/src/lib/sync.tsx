import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getMeta, listOutbox, removeOutbox, setMeta, updateOutbox, type OutboxItem } from './db';
import { flushOutbox } from './outbox';

interface SyncContextValue {
  online: boolean;
  syncing: boolean;
  pending: OutboxItem[];
  pendingCount: number;
  failedCount: number;
  lastSyncAt: number | null;
  refreshQueue: () => Promise<void>;
  flush: () => Promise<{ sent: number; failed: number }>;
  discard: (id: string) => Promise<void>;
  retry: (id: string) => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

const LAST_SYNC_KEY = 'lastSyncAt';

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [pending, setPending] = useState<OutboxItem[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const flushing = useRef(false);

  const refreshQueue = useCallback(async () => {
    setPending(await listOutbox());
  }, []);

  /**
   * Dispara el vaciado de la cola. El algoritmo vive en `flushOutbox`, aparte de
   * React, para poder probarlo sin montar componentes.
   */
  const flush = useCallback(async () => {
    if (flushing.current || !navigator.onLine) return { sent: 0, failed: 0 };
    flushing.current = true;
    setSyncing(true);
    try {
      const result = await flushOutbox();
      const now = Date.now();
      await setMeta(LAST_SYNC_KEY, now);
      setLastSyncAt(now);
      return { sent: result.sent, failed: result.failed };
    } finally {
      flushing.current = false;
      setSyncing(false);
      await refreshQueue();
    }
  }, [refreshQueue]);

  const discard = useCallback(
    async (id: string) => {
      await removeOutbox(id);
      await refreshQueue();
    },
    [refreshQueue],
  );

  const retry = useCallback(
    async (id: string) => {
      await updateOutbox(id, { status: 'PENDING', attempts: 0, lastError: undefined });
      await refreshQueue();
      await flush();
    },
    [flush, refreshQueue],
  );

  useEffect(() => {
    void refreshQueue();
    void getMeta<number>(LAST_SYNC_KEY).then((value) => setLastSyncAt(value ?? null));
  }, [refreshQueue]);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      void flush();
    };
    const goOffline = () => setOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    // El evento `online` del navegador es optimista: informa que hay interfaz de
    // red, no que el servidor responda. Por eso ademas se reintenta cada minuto.
    const timer = window.setInterval(() => {
      if (navigator.onLine) void flush();
    }, 60_000);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.clearInterval(timer);
    };
  }, [flush]);

  const value = useMemo<SyncContextValue>(() => {
    const active = pending.filter((item) => item.status !== 'DONE');
    return {
      online,
      syncing,
      pending: active,
      pendingCount: active.filter((item) => item.status !== 'FAILED').length,
      failedCount: active.filter((item) => item.status === 'FAILED').length,
      lastSyncAt,
      refreshQueue,
      flush,
      discard,
      retry,
    };
  }, [online, syncing, pending, lastSyncAt, refreshQueue, flush, discard, retry]);

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export const useSync = (): SyncContextValue => {
  const context = useContext(SyncContext);
  if (!context) throw new Error('useSync debe usarse dentro de SyncProvider.');
  return context;
};
