import { debeCompletarDatos } from './datos-del-personal';

describe('debeCompletarDatos', () => {
  it('el personal sin datos confirmados debe completarlos', () => {
    expect(debeCompletarDatos('ADMINISTRADOR', null)).toBe(true);
    expect(debeCompletarDatos('RECEPCIONISTA', undefined)).toBe(true);
  });

  it('con los datos confirmados, o si es jugador, no', () => {
    expect(debeCompletarDatos('RECEPCIONISTA', new Date())).toBe(false);
    expect(debeCompletarDatos('JUGADOR', null)).toBe(false);
  });
});
