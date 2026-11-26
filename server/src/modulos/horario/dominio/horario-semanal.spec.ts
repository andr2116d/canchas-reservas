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
});
