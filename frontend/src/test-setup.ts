/**
 * Entorno de los tests: IndexedDB falso y stubs de las APIs del navegador que
 * la capa offline consulta. Sin esto, `navigator.onLine` y `crypto.randomUUID`
 * no existen en jsdom y la cola no podria probarse.
 */
import 'fake-indexeddb/auto';

if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      randomUUID: () =>
        `${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}` as `${string}-${string}-${string}-${string}-${string}`,
    },
    configurable: true,
  });
}

export const setOnline = (online: boolean): void => {
  Object.defineProperty(navigator, 'onLine', { value: online, configurable: true });
};
