import { quantitiesDiffer, toDecimalString, toNumber } from './numbers';

describe('utilidades numericas', () => {
  describe('toNumber', () => {
    it('convierte el numeric de PostgreSQL, que llega como string', () => {
      expect(toNumber('612.400')).toBe(612.4);
    });

    it('trata null y undefined como cero', () => {
      expect(toNumber(null)).toBe(0);
      expect(toNumber(undefined)).toBe(0);
    });
  });

  describe('toDecimalString', () => {
    it('fija la escala para que la base reciba siempre el mismo formato', () => {
      expect(toDecimalString(612.4)).toBe('612.400');
      expect(toDecimalString('0.1')).toBe('0.100');
    });
  });

  describe('quantitiesDiffer', () => {
    it('no marca diferencia por ruido de coma flotante', () => {
      expect(quantitiesDiffer(0.1 + 0.2, 0.3)).toBe(false);
      expect(quantitiesDiffer(938.5, 938.5)).toBe(false);
    });

    it('marca una diferencia real de cantidad', () => {
      expect(quantitiesDiffer(940, 938.5)).toBe(true);
    });
  });
});
