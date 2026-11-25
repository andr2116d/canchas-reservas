import { EnMemoriaAdelantoRepository } from '../../../../test/adelanto/dobles/en-memoria-adelanto.repository';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import { ConsultarAdelantoUseCase } from './consultar-adelanto.use-case';
import { DefinirAdelantoUseCase } from './definir-adelanto.use-case';

const ADMINISTRADOR = 9;

function preparar() {
  const adelantos = new EnMemoriaAdelantoRepository();
  const reloj = new RelojDePrueba();
  return {
    adelantos,
    reloj,
    definir: new DefinirAdelantoUseCase(adelantos, reloj),
    consultar: new ConsultarAdelantoUseCase(adelantos),
  };
}

describe('Definir el adelanto mínimo', () => {
  it('guarda una versión con quién y cuándo', async () => {
    const { definir, reloj } = preparar();

    const { cambio, vigente } = await definir.ejecutar(
      { porcentaje: '50' },
      ADMINISTRADOR,
    );

    expect(cambio).toBe(true);
    expect(vigente).toEqual({
      porcentaje: 50,
      guardadoEn: reloj.ahora(),
      guardadoPor: `Administración ${ADMINISTRADOR}`,
    });
  });

  it('guardar el mismo porcentaje no crea otra versión', async () => {
    const { definir, adelantos } = preparar();
    await definir.ejecutar({ porcentaje: '50' }, ADMINISTRADOR);

    const { cambio } = await definir.ejecutar(
      { porcentaje: ' 50' },
      ADMINISTRADOR,
    );

    expect(cambio).toBe(false);
    expect(adelantos.versiones).toHaveLength(1);
  });

  it('rechaza un porcentaje fuera de rango y dice en qué campo', async () => {
    const { definir, adelantos } = preparar();

    const rechazo = definir.ejecutar({ porcentaje: '0' }, ADMINISTRADOR);

    await expect(rechazo).rejects.toThrow(ReglaInvalidaError);
    await expect(rechazo).rejects.toMatchObject({
      errores: { porcentaje: 'Usa un número entero de 1 a 100.' },
    });
    expect(adelantos.versiones).toHaveLength(0);
  });
});

describe('Consultar el adelanto mínimo', () => {
  it('sin adelanto guardado no hay vigente y propone 50 %', async () => {
    const { consultar } = preparar();

    const consulta = await consultar.ejecutar();

    expect(consulta).toEqual({ historial: [], propuesta: 50 });
  });

  it('devuelve el vigente y las versiones de la más reciente a la más antigua', async () => {
    const { definir, consultar, reloj } = preparar();
    await definir.ejecutar({ porcentaje: '40' }, ADMINISTRADOR);
    reloj.avanzarMinutos(5);
    await definir.ejecutar({ porcentaje: '50' }, ADMINISTRADOR);

    const { vigente, historial } = await consultar.ejecutar();

    expect(vigente?.porcentaje).toBe(50);
    expect(historial.map((version) => version.porcentaje)).toEqual([50, 40]);
  });
});
