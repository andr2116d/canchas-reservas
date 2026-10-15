import { Prisma } from '../../generated/prisma/client';
import { repartirCredito } from './aplicacion-credito';

const d = (valor: string) => new Prisma.Decimal(valor);
const credito = (id: number, saldo: string) => ({ id, saldo: d(saldo) });
const comoTexto = ({ aplicado, usos }: ReturnType<typeof repartirCredito>) => ({
  aplicado: aplicado.toFixed(2),
  usos: usos.map((u) => ({
    creditoId: u.creditoId,
    monto: u.monto.toFixed(2),
  })),
});

describe('repartirCredito', () => {
  it('con crédito menor al adelanto usa todo el crédito', () => {
    expect(comoTexto(repartirCredito([credito(1, '10')], d('30')))).toEqual({
      aplicado: '10.00',
      usos: [{ creditoId: 1, monto: '10.00' }],
    });
  });

  it('con crédito mayor al adelanto usa solo el adelanto', () => {
    expect(comoTexto(repartirCredito([credito(1, '50')], d('30')))).toEqual({
      aplicado: '30.00',
      usos: [{ creditoId: 1, monto: '30.00' }],
    });
  });

  it('usa los créditos en el orden recibido, del más antiguo al más nuevo', () => {
    expect(
      comoTexto(repartirCredito([credito(1, '5'), credito(2, '10')], d('12'))),
    ).toEqual({
      aplicado: '12.00',
      usos: [
        { creditoId: 1, monto: '5.00' },
        { creditoId: 2, monto: '7.00' },
      ],
    });
  });

  it('no toca los créditos que ya no hacen falta', () => {
    expect(
      comoTexto(
        repartirCredito(
          [credito(1, '20'), credito(2, '10'), credito(3, '5')],
          d('25'),
        ),
      ),
    ).toEqual({
      aplicado: '25.00',
      usos: [
        { creditoId: 1, monto: '20.00' },
        { creditoId: 2, monto: '5.00' },
      ],
    });
  });

  it('mantiene los céntimos exactos', () => {
    expect(
      comoTexto(
        repartirCredito([credito(1, '0.10'), credito(2, '0.20')], d('0.25')),
      ),
    ).toEqual({
      aplicado: '0.25',
      usos: [
        { creditoId: 1, monto: '0.10' },
        { creditoId: 2, monto: '0.15' },
      ],
    });
  });

  it('sin créditos no aplica nada', () => {
    expect(comoTexto(repartirCredito([], d('30')))).toEqual({
      aplicado: '0.00',
      usos: [],
    });
  });

  it('ignora créditos sin saldo', () => {
    expect(
      comoTexto(repartirCredito([credito(1, '0'), credito(2, '8')], d('30'))),
    ).toEqual({
      aplicado: '8.00',
      usos: [{ creditoId: 2, monto: '8.00' }],
    });
  });
});
