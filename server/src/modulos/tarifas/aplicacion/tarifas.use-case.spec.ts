import { EnMemoriaTarifaRepository } from '../../../../test/dobles/en-memoria-tarifa.repository';
import { RelojDePrueba } from '../../../../test/dobles/reloj-de-prueba';
import {
  NoEncontradoError,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { HoraDelDia } from '../dominio/hora-del-dia.value-object';
import { TarifaSinDefinirError } from '../dominio/tarifa-sin-definir.error';
import { CalcularValorDelTurnoUseCase } from './calcular-valor-del-turno.use-case';
import { ConsultarTarifasUseCase } from './consultar-tarifas.use-case';
import { DefinirTarifaUseCase } from './definir-tarifa.use-case';

const ADMINISTRADOR = 9;
const FUTBOL_7 = { precioDia: '50', precioNoche: '100', duracionDelTurno: '3' };

function preparar() {
  const tarifas = new EnMemoriaTarifaRepository();
  const reloj = new RelojDePrueba();
  const horario = {
    inicioDeLaNoche: () => Promise.resolve(HoraDelDia.crear('18:00')),
  };
  return {
    tarifas,
    reloj,
    definir: new DefinirTarifaUseCase(tarifas, reloj),
    consultar: new ConsultarTarifasUseCase(tarifas, horario),
    calcular: new CalcularValorDelTurnoUseCase(tarifas, horario),
  };
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
    expect(tarifas.versiones).toHaveLength(1);
    expect(tarifas.versiones[0].guardadaEn).toEqual(reloj.ahora());
    expect(tarifas.versiones[0].tarifa.precioNoche.enSoles()).toBe('100.00');
  });

  it('guardar los mismos valores no crea otra versión', async () => {
    const { definir, tarifas } = preparar();
    await definir.ejecutar('FUTBOL_7', FUTBOL_7, ADMINISTRADOR);

    const { cambio } = await definir.ejecutar(
      'FUTBOL_7',
      { precioDia: '50.00', precioNoche: '100', duracionDelTurno: '3' },
      ADMINISTRADOR,
    );

    expect(cambio).toBe(false);
    expect(tarifas.versiones).toHaveLength(1);
  });

  it('permite el mismo precio de día y de noche, y entre tipos', async () => {
    const { definir, tarifas } = preparar();
    const igual = { precioDia: '40', precioNoche: '40', duracionDelTurno: '1' };

    await definir.ejecutar('FUTBOL_5', igual, ADMINISTRADOR);
    await definir.ejecutar('FUTBOL_7', igual, ADMINISTRADOR);

    expect(tarifas.versiones).toHaveLength(2);
  });

  it('reúne los errores de cada dato y no guarda nada', async () => {
    const { definir, tarifas } = preparar();

    const error = await capturar(
      definir.ejecutar(
        'FUTBOL_5',
        { precioDia: '0', precioNoche: '-5', duracionDelTurno: '0' },
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
  it('muestra la vigente de cada tipo, los que faltan y desde qué hora es de noche', async () => {
    const { definir, consultar } = preparar();
    await definir.ejecutar('FUTBOL_7', FUTBOL_7, ADMINISTRADOR);

    const resultado = await consultar.ejecutar();

    expect(resultado.inicioDeLaNoche).toBe('18:00');
    expect(resultado.tarifas).toEqual([
      { tipo: 'FUTBOL_5', vigente: undefined, historial: [] },
      expect.objectContaining({
        tipo: 'FUTBOL_7',
        vigente: expect.objectContaining({
          precioDia: '50.00',
          duracionDelTurnoHoras: 3,
        }),
      }),
    ]);
  });
});

describe('Calcular el valor de un turno', () => {
  it('calcula el valor proporcional con su desglose', async () => {
    const { definir, calcular } = preparar();
    await definir.ejecutar('FUTBOL_7', FUTBOL_7, ADMINISTRADOR);

    const valor = await calcular.ejecutar('FUTBOL_7', '17:00');

    expect(valor).toMatchObject({ total: '83.33', duracionDelTurnoHoras: 3 });
    expect(valor.tramos).toHaveLength(2);
  });

  it('avisa si el tipo todavía no tiene tarifa', async () => {
    const { calcular } = preparar();

    await expect(calcular.ejecutar('FUTBOL_5', '10:00')).rejects.toBeInstanceOf(
      TarifaSinDefinirError,
    );
  });

  it('explica una hora inválida o un turno que pasa la medianoche', async () => {
    const { definir, calcular } = preparar();
    await definir.ejecutar('FUTBOL_7', FUTBOL_7, ADMINISTRADOR);

    const formato = await capturar(calcular.ejecutar('FUTBOL_7', '7pm'));
    const tarde = await capturar(calcular.ejecutar('FUTBOL_7', '22:00'));

    expect((formato as ReglaInvalidaError).errores).toEqual({
      inicio: 'Ingresa la hora como HH:MM, por ejemplo 18:00.',
    });
    expect((tarde as ReglaInvalidaError).errores).toEqual({
      inicio: 'El turno debe terminar antes de la medianoche.',
    });
  });
});
