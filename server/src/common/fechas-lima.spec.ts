import { inicioDeHoyEnLima } from './fechas-lima';

describe('fechas en Lima', () => {
  describe('inicioDeHoyEnLima', () => {
    it('usa la fecha de Lima aunque en UTC ya sea el día siguiente', () => {
      expect(inicioDeHoyEnLima(new Date('2026-10-16T03:30:00.000Z'))).toEqual(
        new Date('2026-10-15T00:00:00.000Z'),
      );
    });
  });
});
