import { temporalVencida, vencimientoDeTemporal } from './contrasena-temporal';

const AHORA = new Date('2026-11-22T15:00:00.000Z');

describe('Contraseña temporal', () => {
  it('sirve por 7 días desde que se asigna', () => {
    expect(vencimientoDeTemporal(AHORA)).toEqual(
      new Date('2026-11-29T15:00:00.000Z'),
    );
  });

  it('vence al llegar a su fecha', () => {
    const vence = vencimientoDeTemporal(AHORA);

    expect(temporalVencida(vence, new Date(vence.getTime() - 1))).toBe(false);
    expect(temporalVencida(vence, vence)).toBe(true);
  });

  it('una contraseña sin vencimiento no vence', () => {
    expect(temporalVencida(undefined, AHORA)).toBe(false);
  });
});
