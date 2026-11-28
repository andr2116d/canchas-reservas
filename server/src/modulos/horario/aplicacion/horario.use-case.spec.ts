import { EnMemoriaHorarioRepository } from '../../../../test/horario/dobles/en-memoria-horario.repository';
import { ReservasPorJugarDePrueba } from '../../../../test/horario/dobles/reservas-por-jugar-de-prueba';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import type { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import { DIAS_DE_LA_SEMANA } from '../dominio/dia-de-la-semana';
import { ConsultarHorarioUseCase } from './consultar-horario.use-case';
import {
  type DatosDelHorario,
  DefinirHorarioUseCase,
} from './definir-horario.use-case';

const ADMINISTRADOR = 9;

function unaSemana(
  cambios: Partial<Record<string, object>> = {},
): DatosDelHorario {
  return {
    inicioDeLaNoche: '18:00',
    dias: DIAS_DE_LA_SEMANA.map((dia) => ({
      dia,
      abierto: dia !== 'DOMINGO',
      abre: '08:00',
      cierra: '22:00',
      ...cambios[dia],
    })),
  };
}

function preparar() {
  const horarios = new EnMemoriaHorarioRepository();
  const reloj = new RelojDePrueba();
  return {
    horarios,
    reloj,
    definir: new DefinirHorarioUseCase(
      horarios,
      new ReservasPorJugarDePrueba(),
      reloj,
    ),
    consultar: new ConsultarHorarioUseCase(horarios),
  };
}

async function errores(promesa: Promise<unknown>) {
  return promesa.then(
    () => {
      throw new Error('Se esperaba un error');
    },
    (error: ReglaInvalidaError) => error.errores,
  );
}

describe('Definir el horario de atención', () => {
  it('guarda una versión con los días abiertos, quién y cuándo', async () => {
    const { definir, horarios, reloj } = preparar();

    const { cambio } = await definir.ejecutar(unaSemana(), ADMINISTRADOR);

    expect(cambio).toBe(true);
    const [version] = horarios.versiones;
    expect(version.guardadoEn).toEqual(reloj.ahora());
    expect(version.horario.del('DOMINGO')).toBeUndefined();
    expect(version.horario.del('LUNES')?.cierra.texto).toBe('22:00');
  });

  it('guarda la hora de noche propia de un día', async () => {
    const { definir, horarios } = preparar();

    await definir.ejecutar(
      unaSemana({ SABADO: { inicioDeLaNoche: '17:00' } }),
      ADMINISTRADOR,
    );

    expect(
      horarios.versiones[0].horario.inicioDeLaNocheDel('SABADO').texto,
    ).toBe('17:00');
  });

  it('guardar el mismo horario no crea otra versión', async () => {
    const { definir, horarios } = preparar();
    await definir.ejecutar(unaSemana(), ADMINISTRADOR);

    const { cambio } = await definir.ejecutar(unaSemana(), ADMINISTRADOR);

    expect(cambio).toBe(false);
    expect(horarios.versiones).toHaveLength(1);
  });

  it('un día cerrado no necesita horas', async () => {
    const { definir, horarios } = preparar();

    await definir.ejecutar(
      unaSemana({
        LUNES: { abierto: false, abre: undefined, cierra: undefined },
      }),
      ADMINISTRADOR,
    );

    expect(horarios.versiones[0].horario.del('LUNES')).toBeUndefined();
  });

  it('rechaza un cierre igual o anterior a la apertura y dice en qué día', async () => {
    const { definir, horarios } = preparar();

    const resultado = await errores(
      definir.ejecutar(
        unaSemana({
          MARTES: { abre: '22:00', cierra: '10:00' },
          JUEVES: { abre: '9:00' },
        }),
        ADMINISTRADOR,
      ),
    );

    expect(resultado).toEqual({
      'MARTES.cierra': 'El cierre debe ser después de la apertura.',
      'JUEVES.abre': 'Ingresa la hora como HH:MM, por ejemplo 18:00.',
    });
    expect(horarios.versiones).toHaveLength(0);
  });

  it('exige los siete días, sin repetir ninguno', async () => {
    const { definir } = preparar();
    const semana = unaSemana();

    const faltante = await errores(
      definir.ejecutar(
        { ...semana, dias: semana.dias.slice(1) },
        ADMINISTRADOR,
      ),
    );
    const repetido = await errores(
      definir.ejecutar(
        { ...semana, dias: [...semana.dias.slice(1), semana.dias[1]] },
        ADMINISTRADOR,
      ),
    );

    expect(faltante).toEqual({
      dias: 'Indica el horario de los siete días, una vez cada uno.',
    });
    expect(repetido).toEqual(faltante);
  });

  it('valida la hora general de la noche', async () => {
    const { definir } = preparar();

    const resultado = await errores(
      definir.ejecutar(
        { ...unaSemana(), inicioDeLaNoche: '25:00' },
        ADMINISTRADOR,
      ),
    );

    expect(resultado).toEqual({
      inicioDeLaNoche: 'Ingresa la hora como HH:MM, por ejemplo 18:00.',
    });
  });
});

describe('Consultar el horario de atención', () => {
  it('sin horario guardado avisa que no hay y propone la noche por defecto', async () => {
    const { consultar } = preparar();

    await expect(consultar.ejecutar()).resolves.toEqual({
      vigente: undefined,
      historial: [],
      inicioDeLaNochePorDefecto: '18:00',
    });
  });

  it('muestra cada día abierto o cerrado, con su noche propia', async () => {
    const { definir, consultar } = preparar();
    await definir.ejecutar(
      unaSemana({ SABADO: { inicioDeLaNoche: '17:00' } }),
      ADMINISTRADOR,
    );

    const { vigente, historial } = await consultar.ejecutar();

    expect(vigente?.inicioDeLaNoche).toBe('18:00');
    expect(vigente?.dias[0]).toEqual({
      dia: 'LUNES',
      abierto: true,
      abre: '08:00',
      cierra: '22:00',
    });
    expect(vigente?.dias[5]).toMatchObject({
      dia: 'SABADO',
      inicioDeLaNoche: '17:00',
    });
    expect(vigente?.dias[6]).toEqual({ dia: 'DOMINGO', abierto: false });
    expect(historial).toHaveLength(1);
  });
});
