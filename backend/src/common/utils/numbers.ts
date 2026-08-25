/**
 * PostgreSQL numeric llega como string para no perder precision.
 * Estas utilidades centralizan la conversion y evitan comparaciones con float
 * dispersas por el dominio.
 */
export const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : Number.parseFloat(value);
};

export const toDecimalString = (value: number | string, scale = 3): string =>
  (typeof value === 'number' ? value : Number.parseFloat(value)).toFixed(scale);

/** Compara cantidades con tolerancia, para no rechazar 10.000 vs 10 por redondeo. */
export const quantitiesDiffer = (a: number, b: number, tolerance = 0.001): boolean =>
  Math.abs(a - b) > tolerance;
