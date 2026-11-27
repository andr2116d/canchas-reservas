import type { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import { type DatosDelRango, ReglaDeCancelacion } from './regla-de-cancelacion';

const rango = (
  desdeHoras: string,
  porcentaje: string,
  ofreceCredito = false,
): DatosDelRango => ({
  desdeHoras,
  porcentaje,
  ofreceCredito,
});

/** La regla de ejemplo del negocio: 100 % desde 2 h, 50 % desde 1 h y nada con menos. */
const DEL_NEGOCIO = [
  rango('2', '100', true),
  rango('1', '50'),
  rango('0', '0'),
];

function errores(rangos: DatosDelRango[]) {
  try {
    ReglaDeCancelacion.crear(rangos);
  } catch (error) {
    return (error as ReglaInvalidaError).errores;
  }
  throw new Error('Se esperaba un error');
}

describe('ReglaDeCancelacion', () => {
  it('ordena los rangos de más a menos anticipación', () => {
    const regla = ReglaDeCancelacion.crear([
      rango('0', '0'),
      rango('2', '100'),
      rango('1', '50'),
    ]);

    expect(regla.rangos.map((r) => r.desdeHoras)).toEqual([2, 1, 0]);
  });

  it('el crédito solo se ofrece en rangos que devuelven algo', () => {
    const regla = ReglaDeCancelacion.crear([
      rango('2', '100', true),
      rango('0', '0', true),
    ]);

    expect(regla.rangos.map((r) => r.ofreceCredito)).toEqual([true, false]);
  });

  it.each([
    [
      '',
      '50',
      { 'rangos.0.desdeHoras': 'Ingresa desde cuántas horas antes rige.' },
    ],
    ['-1', '50', { 'rangos.0.desdeHoras': 'Usa horas enteras de 0 a 720.' }],
    ['1.5', '50', { 'rangos.0.desdeHoras': 'Usa horas enteras de 0 a 720.' }],
    ['721', '50', { 'rangos.0.desdeHoras': 'Usa horas enteras de 0 a 720.' }],
    [
      '2',
      '',
      { 'rangos.0.porcentaje': 'Ingresa el porcentaje que se devuelve.' },
    ],
    [
      '2',
      '101',
      { 'rangos.0.porcentaje': 'Usa un porcentaje entero de 0 a 100.' },
    ],
    [
      '2',
      '-5',
      { 'rangos.0.porcentaje': 'Usa un porcentaje entero de 0 a 100.' },
    ],
  ])('rechaza desde «%s» horas con «%s» %%', (horas, porcentaje, esperado) => {
    expect(errores([rango(horas, porcentaje), rango('0', '0')])).toEqual(
      esperado,
    );
  });

  it('siempre hay un rango desde 0 horas, para que toda cancelación caiga en uno', () => {
    expect(errores([rango('2', '100'), rango('1', '50')])).toEqual({
      rangos:
        'Agrega un rango desde 0 horas: toda cancelación debe caer en uno.',
    });
  });

  it('no repite el inicio de un rango', () => {
    expect(
      errores([rango('2', '100'), rango('2', '50'), rango('0', '0')]),
    ).toEqual({
      'rangos.1.desdeHoras': 'Ya hay otro rango desde esas horas.',
    });
  });

  it('no deja negar la devolución en todos los casos', () => {
    expect(errores([rango('2', '0'), rango('0', '0')])).toEqual({
      'rangos.0.porcentaje':
        'Debe devolver algo: no se permite negar la devolución en todos los casos.',
    });
  });

  it('un rango con menos anticipación no devuelve más que uno con más', () => {
    expect(
      errores([rango('2', '50'), rango('1', '80'), rango('0', '0')]),
    ).toEqual({
      'rangos.1.porcentaje': 'No puede devolver más que el rango desde 2 h.',
    });
  });

  it('admite como máximo 10 rangos', () => {
    const muchos = Array.from({ length: 11 }, (_, i) =>
      rango(String(10 - i), '100'),
    );

    expect(errores(muchos)).toEqual({ rangos: 'Usa como máximo 10 rangos.' });
  });

  it('elige el rango por la anticipación; el límite exacto cuenta para el mayor', () => {
    const regla = ReglaDeCancelacion.crear(DEL_NEGOCIO);

    expect(regla.rangoPara(120).porcentaje).toBe(100);
    expect(regla.rangoPara(119).porcentaje).toBe(50);
    expect(regla.rangoPara(60).porcentaje).toBe(50);
    expect(regla.rangoPara(59).porcentaje).toBe(0);
    expect(regla.rangoPara(0).porcentaje).toBe(0);
  });

  it('da los plazos de un turno con su fecha y hora: hasta cuándo rige cada rango', () => {
    const regla = ReglaDeCancelacion.crear(DEL_NEGOCIO);
    const inicio = new Date('2026-11-28T19:00:00-05:00');
    const ahora = new Date('2026-11-27T10:00:00-05:00');

    expect(regla.plazosPara(inicio, ahora)).toEqual([
      {
        hasta: new Date('2026-11-28T17:00:00-05:00'),
        porcentaje: 100,
        ofreceCredito: true,
      },
      {
        hasta: new Date('2026-11-28T18:00:00-05:00'),
        porcentaje: 50,
        ofreceCredito: false,
      },
      { hasta: inicio, porcentaje: 0, ofreceCredito: false },
    ]);
  });

  it('no da los plazos que ya pasaron; el límite exacto aún cuenta', () => {
    const regla = ReglaDeCancelacion.crear(DEL_NEGOCIO);
    const inicio = new Date('2026-11-28T19:00:00-05:00');

    const porcentajesA = (hora: string) =>
      regla
        .plazosPara(inicio, new Date(`2026-11-28T${hora}-05:00`))
        .map((plazo) => plazo.porcentaje);

    expect(porcentajesA('17:00:00')).toEqual([100, 50, 0]);
    expect(porcentajesA('17:00:01')).toEqual([50, 0]);
  });

  it('compara dos reglas por sus valores', () => {
    const una = ReglaDeCancelacion.crear(DEL_NEGOCIO);

    expect(
      una.igualA(ReglaDeCancelacion.crear([...DEL_NEGOCIO].reverse())),
    ).toBe(true);
    expect(
      una.igualA(
        ReglaDeCancelacion.crear([
          rango('2', '100'),
          rango('1', '50'),
          rango('0', '0'),
        ]),
      ),
    ).toBe(false);
  });
});
