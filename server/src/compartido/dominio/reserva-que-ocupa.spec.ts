import { ocupaElTurno, retieneElTurno } from './reserva-que-ocupa';

describe('Reserva que ocupa su turno', () => {
  const ahora = new Date('2026-11-27T15:00:00-05:00');

  it('ocupan el turno las pendientes, las confirmadas y las que están en juego, no las expiradas', () => {
    const estados = [
      'PENDIENTE_DE_PAGO',
      'PENDIENTE_DE_VALIDACION',
      'CONFIRMADA',
      'EN_JUEGO',
      'EXPIRADA',
    ];

    expect(estados.map(ocupaElTurno)).toEqual([true, true, true, true, false]);
  });

  it('una reserva sin vencimiento o que aún no vence retiene el turno; una vencida no', () => {
    const despues = new Date(ahora.getTime() + 1);

    expect(retieneElTurno({ venceEn: null }, ahora)).toBe(true);
    expect(retieneElTurno({ venceEn: despues }, ahora)).toBe(true);
    expect(retieneElTurno({ venceEn: ahora }, ahora)).toBe(false);
  });
});
