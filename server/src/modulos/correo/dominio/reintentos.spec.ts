import { MAXIMO_DE_INTENTOS, proximoIntento } from './reintentos';

const AHORA = new Date('2026-11-25T15:00:00.000Z');
const minutosDespues = (minutos: number) =>
  new Date(AHORA.getTime() + minutos * 60 * 1000);

describe('proximoIntento', () => {
  it('espera cada vez más entre un intento fallido y el siguiente', () => {
    expect(proximoIntento(1, AHORA)).toEqual(minutosDespues(1));
    expect(proximoIntento(2, AHORA)).toEqual(minutosDespues(5));
    expect(proximoIntento(3, AHORA)).toEqual(minutosDespues(30));
    expect(proximoIntento(4, AHORA)).toEqual(minutosDespues(120));
  });

  it('deja de intentar al llegar al máximo de intentos', () => {
    expect(proximoIntento(MAXIMO_DE_INTENTOS, AHORA)).toBeNull();
  });
});
