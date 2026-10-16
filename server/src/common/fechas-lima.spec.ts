import { fechaEnLima, instanteEnLima, sumarDias } from './fechas-lima';

describe('fechas en Lima', () => {
  describe('instanteEnLima', () => {
    it('convierte la fecha y hora de Lima a UTC', () => {
      expect(instanteEnLima('2026-10-20', '18:00')).toEqual(
        new Date('2026-10-20T23:00:00.000Z'),
      );
    });
  });

  describe('fechaEnLima', () => {
    it('devuelve la fecha de Lima de un instante', () => {
      expect(fechaEnLima(new Date('2026-10-16T04:59:00.000Z'))).toBe(
        '2026-10-15',
      );
      expect(fechaEnLima(new Date('2026-10-16T05:00:00.000Z'))).toBe(
        '2026-10-16',
      );
    });
  });

  describe('sumarDias', () => {
    it('suma días cambiando de mes', () => {
      expect(sumarDias('2026-10-15', 30)).toBe('2026-11-14');
      expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
    });
  });
});
