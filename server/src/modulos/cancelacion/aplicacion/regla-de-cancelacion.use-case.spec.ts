import { EnMemoriaReglaDeCancelacionRepository } from '../../../../test/cancelacion/dobles/en-memoria-regla-de-cancelacion.repository';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import type { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import { ConsultarReglaDeCancelacionUseCase } from './consultar-regla-de-cancelacion.use-case';
import { DefinirReglaDeCancelacionUseCase } from './definir-regla-de-cancelacion.use-case';
import { SimularCancelacionUseCase } from './simular-cancelacion.use-case';

const ADMINISTRADOR = 9;
const DEL_NEGOCIO = [
  { desdeHoras: '2', porcentaje: '100', ofreceCredito: true },
  { desdeHoras: '1', porcentaje: '50', ofreceCredito: false },
  { desdeHoras: '0', porcentaje: '0', ofreceCredito: false },
];

function preparar() {
  const reglas = new EnMemoriaReglaDeCancelacionRepository();
  const reloj = new RelojDePrueba();
  return {
    reglas,
    reloj,
    definir: new DefinirReglaDeCancelacionUseCase(reglas, reloj),
    consultar: new ConsultarReglaDeCancelacionUseCase(reglas),
    simular: new SimularCancelacionUseCase(),
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

describe('Definir la regla de cancelación', () => {
  it('guarda una versión con quién y cuándo', async () => {
    const { definir, reglas, reloj } = preparar();

    const { cambio, vigente } = await definir.ejecutar(
      { rangos: DEL_NEGOCIO },
      ADMINISTRADOR,
    );

    expect(cambio).toBe(true);
    expect(reglas.versiones[0].guardadaEn).toEqual(reloj.ahora());
    expect(vigente.rangos).toEqual([
      { desdeHoras: 2, porcentaje: 100, ofreceCredito: true },
      { desdeHoras: 1, porcentaje: 50, ofreceCredito: false },
      { desdeHoras: 0, porcentaje: 0, ofreceCredito: false },
    ]);
  });

  it('guardar los mismos valores no crea otra versión', async () => {
    const { definir, reglas } = preparar();
    await definir.ejecutar({ rangos: DEL_NEGOCIO }, ADMINISTRADOR);

    const { cambio } = await definir.ejecutar(
      { rangos: [...DEL_NEGOCIO].reverse() },
      ADMINISTRADOR,
    );

    expect(cambio).toBe(false);
    expect(reglas.versiones).toHaveLength(1);
  });

  it('no guarda una regla inválida y dice qué rango corregir', async () => {
    const { definir, reglas } = preparar();

    const resultado = await errores(
      definir.ejecutar(
        {
          rangos: [
            { desdeHoras: '-2', porcentaje: '100', ofreceCredito: false },
          ],
        },
        ADMINISTRADOR,
      ),
    );

    expect(resultado).toEqual({
      'rangos.0.desdeHoras': 'Usa horas enteras de 0 a 720.',
    });
    expect(reglas.versiones).toHaveLength(0);
  });
});

describe('Consultar la regla de cancelación', () => {
  it('sin regla guardada propone la del ejemplo del negocio para empezar', async () => {
    const { consultar } = preparar();

    const resultado = await consultar.ejecutar();

    expect(resultado.vigente).toBeUndefined();
    expect(
      resultado.propuesta.map((rango) => [rango.desdeHoras, rango.porcentaje]),
    ).toEqual([
      [2, 100],
      [1, 50],
      [0, 0],
    ]);
  });

  it('trae la vigente y las anteriores, de la más reciente a la más antigua', async () => {
    const { definir, consultar } = preparar();
    await definir.ejecutar({ rangos: DEL_NEGOCIO }, ADMINISTRADOR);
    await definir.ejecutar(
      {
        rangos: [{ desdeHoras: '0', porcentaje: '100', ofreceCredito: false }],
      },
      ADMINISTRADOR,
    );

    const { vigente, historial } = await consultar.ejecutar();

    expect(vigente?.rangos).toEqual([
      { desdeHoras: 0, porcentaje: 100, ofreceCredito: false },
    ]);
    expect(historial).toHaveLength(2);
    expect(historial[1].rangos).toHaveLength(3);
  });
});

describe('Simular una cancelación', () => {
  it('calcula con la regla en edición, sin guardar nada', async () => {
    const { simular } = preparar();

    const resultado = await simular.ejecutar({
      rangos: DEL_NEGOCIO,
      anticipo: '50',
      pagado: '100',
      minutosDeAnticipacion: 90,
    });

    expect(resultado).toMatchObject({
      porcentaje: 50,
      devolucionDelAnticipo: '25.00',
      excedente: '50.00',
      totalADevolver: '75.00',
    });
  });

  it('ubica cada error en su campo', async () => {
    const { simular } = preparar();

    expect(
      await errores(
        simular.ejecutar({
          rangos: DEL_NEGOCIO,
          anticipo: '0',
          pagado: '50',
          minutosDeAnticipacion: 30,
        }),
      ),
    ).toEqual({
      anticipo: 'El monto debe ser mayor que cero.',
    });
    expect(
      await errores(
        simular.ejecutar({
          rangos: DEL_NEGOCIO,
          anticipo: '50',
          pagado: '40',
          minutosDeAnticipacion: 30,
        }),
      ),
    ).toEqual({
      pagado: 'Lo pagado no puede ser menor que el anticipo.',
    });
  });
});
