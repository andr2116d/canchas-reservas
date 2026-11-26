import { ValorInvalidoError } from './valor-invalido.error';
import { HoraDelDia } from './hora-del-dia.value-object';

describe('HoraDelDia', () => {
  it('lee la hora en formato de 24 horas', () => {
    expect(HoraDelDia.crear('18:00').minutos).toBe(1080);
    expect(HoraDelDia.crear('07:30').minutos).toBe(450);
  });

  it.each(['', '24:00', '7:30', '18:60', 'noche'])('rechaza «%s»', (texto) => {
    expect(() => HoraDelDia.crear(texto)).toThrow(
      new ValorInvalidoError('Ingresa la hora como HH:MM, por ejemplo 18:00.'),
    );
  });

  it('se muestra como HH:MM', () => {
    expect(HoraDelDia.desdeMinutos(1260).texto).toBe('21:00');
  });

  it('admite 24:00 solo como hora de cierre', () => {
    expect(HoraDelDia.crearHastaMedianoche('24:00').minutos).toBe(1440);
    expect(HoraDelDia.crearHastaMedianoche('22:30').minutos).toBe(1350);
    expect(() => HoraDelDia.crearHastaMedianoche('24:01')).toThrow(
      'Ingresa la hora como HH:MM, por ejemplo 18:00.',
    );
  });
});
