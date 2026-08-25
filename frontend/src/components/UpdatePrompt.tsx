import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Aviso de version nueva.
 *
 * La actualizacion se ofrece en lugar de aplicarse sola: recargar sin avisar
 * mientras alguien completa un formulario de campo le haria perder lo cargado.
 */
export const UpdatePrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh && !offlineReady) return null;

  return (
    <div
      style={{
        position: 'fixed',
        insetInline: '1rem',
        bottom: '1rem',
        zIndex: 200,
        maxWidth: '420px',
        marginInline: 'auto',
      }}
    >
      <div className="card" style={{ padding: '0.85rem 1rem' }}>
        <div className="row between">
          <span className="small">
            {needRefresh
              ? 'Hay una versión nueva disponible.'
              : 'La aplicación quedó lista para usarse sin conexión.'}
          </span>
          <div className="row">
            {needRefresh && (
              <button
                type="button"
                className="primary small"
                onClick={() => void updateServiceWorker(true)}
              >
                Actualizar
              </button>
            )}
            <button
              type="button"
              className="ghost small"
              onClick={() => {
                setNeedRefresh(false);
                setOfflineReady(false);
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
