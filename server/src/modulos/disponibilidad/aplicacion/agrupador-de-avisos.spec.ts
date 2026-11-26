import { AgrupadorDeAvisos } from './agrupador-de-avisos';

describe('AgrupadorDeAvisos', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('avisa una sola vez por los cambios que llegan seguidos', () => {
    const avisar = jest.fn();
    const agrupador = new AgrupadorDeAvisos(300, avisar);

    agrupador.recibir();
    agrupador.recibir();
    jest.advanceTimersByTime(299);
    agrupador.recibir();

    expect(avisar).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(avisar).toHaveBeenCalledTimes(1);
  });

  it('un cambio que llega después del aviso produce otro aviso', () => {
    const avisar = jest.fn();
    const agrupador = new AgrupadorDeAvisos(300, avisar);

    agrupador.recibir();
    jest.advanceTimersByTime(300);
    agrupador.recibir();
    jest.advanceTimersByTime(300);

    expect(avisar).toHaveBeenCalledTimes(2);
  });

  it('al detenerse no deja avisos pendientes', () => {
    const avisar = jest.fn();
    const agrupador = new AgrupadorDeAvisos(300, avisar);

    agrupador.recibir();
    agrupador.detener();
    jest.advanceTimersByTime(1000);

    expect(avisar).not.toHaveBeenCalled();
  });
});
