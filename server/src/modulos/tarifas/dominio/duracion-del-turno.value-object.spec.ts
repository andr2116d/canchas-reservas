import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { DuracionDelTurno } from './duracion-del-turno.value-object';

describe('DuracionDelTurno', () => {
  it.each(['1', '3', '12'])('acepta %s horas', (texto) => {
    expect(DuracionDelTurno.crear(texto).horas).toBe(Number(texto));
  });

  it.each(['', '0', '13', '1.5', 'dos', '-2'])('rechaza «%s»', (texto) => {
    expect(() => DuracionDelTurno.crear(texto)).toThrow(
      new ValorInvalidoError('Elige un turno de 1 a 12 horas enteras.'),
    );
  });
});
