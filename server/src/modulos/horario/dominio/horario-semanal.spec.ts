import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { DIAS_DE_LA_SEMANA } from './dia-de-la-semana';
import { HorarioDelDia } from './horario-del-dia';
import { HorarioSemanal } from './horario-semanal';

const unDia = (abre = '08:00', cierra = '22:00', noche?: string) =>
  HorarioDelDia.crear({ abre, cierra, inicioDeLaNoche: noche });

describe('HorarioDelDia', () => {
  it('abre y cierra a la hora elegida, al minuto', () => {
    const dia = unDia('07:45', '23:15');

    expect([dia.abre.texto, dia.cierra.texto]).toEqual(['07:45', '23:15']);
  });

  it('puede cerrar a medianoche', () => {
    expect(unDia('16:00', '24:00').cierra.minutos).toBe(1440);
  });

  it.each([
    ['22:00', '22:00'],
    ['22:00', '08:00'],
  ])('rechaza abrir a las %s y cerrar a las %s', (abre, cierra) => {
    expect(() => unDia(abre, cierra)).toThrow(
      new ValorInvalidoError('El cierre debe ser después de la apertura.'),
    );
  });

  it('no deja cerrar después de medianoche', () => {
    expect(() => unDia('16:00', '01:00')).toThrow(
      'El cierre debe ser después de la apertura.',
    );
  });
});

describe('HorarioSemanal', () => {
  const lunesASabado = () =>
    new Map(
      DIAS_DE_LA_SEMANA.filter((dia) => dia !== 'DOMINGO').map((dia) => [
        dia,
        unDia(),
      ]),
    );

  it('un día sin horario está cerrado', () => {
    const horario = HorarioSemanal.crear('18:00', lunesASabado());

    expect(horario.del('DOMINGO')).toBeUndefined();
    expect(horario.del('LUNES')?.abre.texto).toBe('08:00');
  });

  it('la noche empieza a la hora general salvo que el día tenga la suya', () => {
    const dias = lunesASabado();
    dias.set('SABADO', unDia('08:00', '22:00', '17:00'));
    const horario = HorarioSemanal.crear('18:00', dias);

    expect(horario.inicioDeLaNocheDel('LUNES').texto).toBe('18:00');
    expect(horario.inicioDeLaNocheDel('SABADO').texto).toBe('17:00');
  });

  it('compara dos horarios por sus valores', () => {
    const uno = HorarioSemanal.crear('18:00', lunesASabado());

    expect(uno.igualA(HorarioSemanal.crear('18:00', lunesASabado()))).toBe(
      true,
    );
    expect(uno.igualA(HorarioSemanal.crear('19:00', lunesASabado()))).toBe(
      false,
    );
    expect(uno.igualA(HorarioSemanal.crear('18:00', new Map()))).toBe(false);
  });

  describe('si atiende un rato de una fecha', () => {
    // El sábado 28 de noviembre de 2026 abre de 08:00 a 22:00; el domingo 29, cerrado.
    const horario = HorarioSemanal.crear('18:00', lunesASabado());
    const hora = (texto: string) =>
      Number(texto.slice(0, 2)) * 60 + Number(texto.slice(3));

    it.each([
      {
        caso: 'dentro de la atención',
        fecha: '2026-11-28',
        desde: '19:00',
        hasta: '20:00',
        atiende: true,
      },
      {
        caso: 'justo de la apertura al cierre',
        fecha: '2026-11-28',
        desde: '08:00',
        hasta: '22:00',
        atiende: true,
      },
      {
        caso: 'empieza antes de abrir',
        fecha: '2026-11-28',
        desde: '07:30',
        hasta: '08:30',
        atiende: false,
      },
      {
        caso: 'termina después de cerrar',
        fecha: '2026-11-28',
        desde: '21:30',
        hasta: '22:30',
        atiende: false,
      },
      {
        caso: 'el día cierra',
        fecha: '2026-11-29',
        desde: '19:00',
        hasta: '20:00',
        atiende: false,
      },
    ])('$caso', ({ fecha, desde, hasta, atiende }) => {
      expect(horario.atiende(fecha, hora(desde), hora(hasta))).toBe(atiende);
    });
  });
});
