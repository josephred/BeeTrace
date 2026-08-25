/**
 * Resolucion de la URL base de la API.
 *
 * Render inyecta el host pelado (`beetrace-api.onrender.com`) cuando se usa
 * `fromService`, mientras que en desarrollo se prefiere la ruta relativa `/api`
 * para aprovechar el proxy de Vite y evitar CORS. Esta funcion normaliza ambos
 * casos para que el resto del codigo no tenga que pensarlo.
 */
const RAW = (import.meta.env.VITE_API_URL ?? '').trim();

export const API_PREFIX = '/api/v1';

export const apiBaseUrl = ((): string => {
  if (!RAW) return API_PREFIX; // desarrollo: proxy de Vite
  const withScheme = RAW.includes('://') ? RAW : `https://${RAW}`;
  const withoutTrailingSlash = withScheme.replace(/\/+$/, '');
  return withoutTrailingSlash.endsWith(API_PREFIX)
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}${API_PREFIX}`;
})();

/** Health check: cuelga de la raiz del servicio, fuera del prefijo de la API. */
export const healthUrl = apiBaseUrl.replace(new RegExp(`${API_PREFIX}$`), '') + '/health';

export const APP_NAME = 'BeeTrace';
