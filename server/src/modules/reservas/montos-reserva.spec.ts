import { Prisma } from '../../generated/prisma/client';
import { calcularMontosReserva } from './montos-reserva';

describe('montos de la reserva', () => {
  it('sin pagos aprobados todo el valor queda pendiente', () => {
    expect(calcularMontosReserva(80, [])).toEqual({
      adelantoPagado: 0,
      saldoPendiente: 80,
      pagadoTurno: 0,
    });
  });

  it('un adelanto de 40 sobre 80 deja 40 de saldo', () => {
    expect(
      calcularMontosReserva(80, [{ concepto: 'ADELANTO', monto: 40 }]),
    ).toEqual({ adelantoPagado: 40, saldoPendiente: 40, pagadoTurno: 40 });
  });

  it('suma varios adelantos, incluidos los pagados con crédito', () => {
    expect(
      calcularMontosReserva(new Prisma.Decimal('90.00'), [
        { concepto: 'ADELANTO', monto: new Prisma.Decimal('12.50') },
        { concepto: 'ADELANTO', monto: new Prisma.Decimal('32.50') },
      ]),
    ).toEqual({ adelantoPagado: 45, saldoPendiente: 45, pagadoTurno: 45 });
  });

  it('el pago de saldo reduce el saldo pero no el adelanto', () => {
    expect(
      calcularMontosReserva(80, [
        { concepto: 'ADELANTO', monto: 40 },
        { concepto: 'SALDO', monto: 40 },
      ]),
    ).toEqual({ adelantoPagado: 40, saldoPendiente: 0, pagadoTurno: 80 });
  });

  it('los pagos de adicionales no cuentan para el turno', () => {
    expect(
      calcularMontosReserva(80, [
        { concepto: 'ADELANTO', monto: 40 },
        { concepto: 'ADICIONALES', monto: 25 },
      ]),
    ).toEqual({ adelantoPagado: 40, saldoPendiente: 40, pagadoTurno: 40 });
  });

  it('el saldo nunca es negativo', () => {
    expect(
      calcularMontosReserva(80, [
        { concepto: 'ADELANTO', monto: 50 },
        { concepto: 'SALDO', monto: 40 },
      ]),
    ).toEqual({ adelantoPagado: 50, saldoPendiente: 0, pagadoTurno: 90 });
  });

  it('lo pagado del turno no se recorta aunque supere el valor, a diferencia del saldo', () => {
    expect(
      calcularMontosReserva(80, [
        { concepto: 'ADELANTO', monto: 60 },
        { concepto: 'SALDO', monto: 40 },
        { concepto: 'ADICIONALES', monto: 15 },
      ]),
    ).toEqual({ adelantoPagado: 60, saldoPendiente: 0, pagadoTurno: 100 });
  });

  it('suma céntimos sin errores de redondeo', () => {
    expect(
      calcularMontosReserva('0.30', [
        { concepto: 'ADELANTO', monto: '0.10' },
        { concepto: 'SALDO', monto: '0.10' },
      ]),
    ).toEqual({ adelantoPagado: 0.1, saldoPendiente: 0.1, pagadoTurno: 0.2 });
  });
});
