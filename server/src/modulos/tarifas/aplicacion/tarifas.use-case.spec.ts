import { EnMemoriaHorarioRepository } from '../../../../test/horario/dobles/en-memoria-horario.repository';
import { EnMemoriaTarifaRepository } from '../../../../test/tarifas/dobles/en-memoria-tarifa.repository';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import {
  NoEncontradoError,
  type ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { HorarioDelDia } from '../../horario/dominio/horario-del-dia';
import { HorarioSemanal } from '../../horario/dominio/horario-semanal';
import { TarifaSinDefinirError } from '../dominio/tarifa-sin-definir.error';
import { ConsultarTarifasUseCase } from './consultar-tarifas.use-case';
import { DefinirTarifaUseCase } from './definir-tarifa.use-case';
import { TurnosDelDiaUseCase } from './turnos-del-dia.use-case';

const ADMINISTRADOR = 9;
const FUTBOL_7 = {
  precioDia: '50',
  precioNoche: '100',
  duracionDelTurno: '3',
  ofreceTurnoCorto: false,
};

function preparar() {
  const tarifas = new EnMemoriaTarifaRepository();
  const horarios = new EnMemoriaHorarioRepository();
  const reloj = new RelojDePrueba();
  return {
    tarifas,
    horarios,
    reloj,
    definir: new DefinirTarifaUseCase(tarifas, reloj),
    consultar: new ConsultarTarifasUseCase(tarifas),
    turnos: new TurnosDelDiaUseCase(tarifas, horarios),
  };
}

/** Abre de lunes a sábado de 08:00 a 22:00; el sábado la noche empieza a las 17:00. */
async function guardarHorario(horarios: EnMemoriaHorarioRepository) {
  const dia = (noche?: string) =>
    HorarioDelDia.crear({
      abre: '08:00',
      cierra: '22:00',
      inicioDeLaNoche: noche,
    });
  const dias = new Map([
    ['LUNES', dia()],
    ['SABADO', dia('17:00')],
  ] as const);
  await horarios.guardarSiCambia(
    HorarioSemanal.crear('18:00', dias),
    ADMINISTRADOR,
    new Date(),
  );
}

async function capturar(promesa: Promise<unknown>) {
  return promesa.then(
    () => {
      throw new Error('Se esperaba un error');
    },
    (error: unknown) => error,
  );
}

describe('Definir tarifas', () => {
  it('guarda una versión con quién y cuándo', async () => {
    const { definir, tarifas, reloj } = preparar();

    const { cambio } = await definir.ejecutar(
      'FUTBOL_7',
      FUTBOL_7,
      ADMINISTRADOR,
    );

    expect(cambio).toBe(true);
    expect(tarifas.versiones[0].guardadaEn).toEqual(reloj.ahora());
    expect(tarifas.versiones[0].tarifa.precioNoche.enSoles()).toBe('100.00');
  });

  it('guardar los mismos valores no crea otra versión, pero cambiar el turno corto sí', async () => {
    const { definir, tarifas } = preparar();
    await definir.ejecutar('FUTBOL_7', FUTBOL_7, ADMINISTRADOR);

    const igual = await definir.ejecutar(
      'FUTBOL_7',
      { ...FUTBOL_7, precioDia: '50.00' },
      ADMINISTRADOR,
    );
    const otra = await definir.ejecutar(
      'FUTBOL_7',
      { ...FUTBOL_7, ofreceTurnoCorto: true },
      ADMINISTRADOR,
    );

    expect([igual.cambio, otra.cambio]).toEqual([false, true]);
    expect(tarifas.versiones).toHaveLength(2);
  });

  it('permite el mismo precio de día y de noche, y entre tipos', async () => {
    const { definir, tarifas } = preparar();
    const igual = { ...FUTBOL_7, precioDia: '40', precioNoche: '40' };

    await definir.ejecutar('FUTBOL_5', igual, ADMINISTRADOR);
    await definir.ejecutar('FUTBOL_7', igual, ADMINISTRADOR);

    expect(tarifas.versiones).toHaveLength(2);
  });

  it('reúne los errores de cada dato y no guarda nada', async () => {
    const { definir, tarifas } = preparar();

    const error = await capturar(
      definir.ejecutar(
        'FUTBOL_5',
        {
          precioDia: '0',
          precioNoche: '-5',
          duracionDelTurno: '0',
          ofreceTurnoCorto: false,
        },
        ADMINISTRADOR,
      ),
    );

    expect(Object.keys((error as ReglaInvalidaError).errores)).toEqual([
      'precioDia',
      'precioNoche',
      'duracionDelTurno',
    ]);
    expect(tarifas.versiones).toHaveLength(0);
  });

  it('avisa si el tipo de cancha no existe', async () => {
    const { definir } = preparar();

    await expect(
      definir.ejecutar('FUTBOL_11', FUTBOL_7, ADMINISTRADOR),
    ).rejects.toBeInstanceOf(NoEncontradoError);
  });
});

describe('Consultar tarifas', () => {
  it('muestra la vigente de cada tipo y los que faltan', async () => {
    const { definir, consultar } = preparar();
    await definir.ejecutar('FUTBOL_7', FUTBOL_7, ADMINISTRADOR);

    const { tarifas } = await consultar.ejecutar();

    expect(tarifas).toEqual([
      { tipo: 'FUTBOL_5', vigente: undefined, historial: [] },
      expect.objectContaining({
        tipo: 'FUTBOL_7',
        vigente: expect.objectContaining({
          precioDia: '50.00',
          duracionDelTurnoHoras: 3,
          ofreceTurnoCorto: false,
        }),
      }),
    ]);
  });
});

describe('Turnos del día', () => {
  it('da cada turno del día con su precio y avisa del rato sin turno', async () => {
    const { definir, horarios, turnos } = preparar();
    await definir.ejecutar('FUTBOL_7', FUTBOL_7, ADMINISTRADOR);
    await guardarHorario(horarios);

    const lunes = await turnos.ejecutar('FUTBOL_7', 'LUNES');

    expect(lunes).toMatchObject({
      estado: 'ABIERTO',
      inicioDeLaNoche: '18:00',
      sinTurno: { desde: '20:00', hasta: '22:00' },
    });
    if (lunes.estado !== 'ABIERTO') return;
    expect(
      lunes.turnos.map(
        (turno) => `${turno.desde}-${turno.hasta} ${turno.total}`,
      ),
    ).toEqual([
      '08:00-11:00 50.00',
      '11:00-14:00 50.00',
      '14:00-17:00 50.00',
      '17:00-20:00 83.33',
    ]);
  });

  it('usa la hora de noche propia del día y ofrece el turno corto si la tarifa lo permite', async () => {
    const { definir, horarios, turnos } = preparar();
    await definir.ejecutar(
      'FUTBOL_7',
      { ...FUTBOL_7, ofreceTurnoCorto: true },
      ADMINISTRADOR,
    );
    await guardarHorario(horarios);

    const sabado = await turnos.ejecutar('FUTBOL_7', 'SABADO');

    if (sabado.estado !== 'ABIERTO')
      throw new Error('Se esperaba un día abierto');
    expect(sabado.turnos.at(-2)?.total).toBe('100.00');
    expect(sabado.turnos.at(-1)).toMatchObject({
      desde: '20:00',
      hasta: '22:00',
      corto: true,
      total: '66.67',
    });
    expect(sabado.sinTurno).toBeUndefined();
  });

  it('distingue un día cerrado de un local sin horario', async () => {
    const { definir, horarios, turnos } = preparar();
    await definir.ejecutar('FUTBOL_7', FUTBOL_7, ADMINISTRADOR);

    await expect(turnos.ejecutar('FUTBOL_7', 'LUNES')).resolves.toEqual({
      estado: 'SIN_HORARIO',
    });
    await guardarHorario(horarios);
    await expect(turnos.ejecutar('FUTBOL_7', 'DOMINGO')).resolves.toEqual({
      estado: 'CERRADO',
    });
  });

  it('avisa si el tipo todavía no tiene tarifa o el día no existe', async () => {
    const { turnos } = preparar();

    await expect(turnos.ejecutar('FUTBOL_5', 'LUNES')).rejects.toBeInstanceOf(
      TarifaSinDefinirError,
    );
    const error = await capturar(turnos.ejecutar('FUTBOL_5', 'FERIADO'));
    expect((error as ReglaInvalidaError).errores).toEqual({
      dia: 'Elige un día de la semana.',
    });
  });
});
