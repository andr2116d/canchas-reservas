import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { EnMemoriaPlazoDePagoRepository } from '../../../../test/plazo-de-pago/dobles/en-memoria-plazo-de-pago.repository';
import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import { ConsultarPlazoDePagoUseCase } from './consultar-plazo-de-pago.use-case';
import { DefinirPlazoDePagoUseCase } from './definir-plazo-de-pago.use-case';
import { PlazoVigenteUseCase } from './plazo-vigente.use-case';

const ADMINISTRADOR = 9;

function preparar() {
  const plazos = new EnMemoriaPlazoDePagoRepository();
  const reloj = new RelojDePrueba();
  return {
    plazos,
    reloj,
    definir: new DefinirPlazoDePagoUseCase(plazos, reloj),
    consultar: new ConsultarPlazoDePagoUseCase(plazos),
    vigente: new PlazoVigenteUseCase(plazos),
  };
}

describe('Definir el plazo para pagar el adelanto', () => {
  it('guarda una versión con quién y cuándo', async () => {
    const { definir, reloj } = preparar();

    const { cambio, vigente } = await definir.ejecutar(
      { minutos: '30' },
      ADMINISTRADOR,
    );

    expect(cambio).toBe(true);
    expect(vigente).toEqual({
      minutos: 30,
      guardadaEn: reloj.ahora(),
      guardadaPor: `Administración ${ADMINISTRADOR}`,
    });
  });

  it('guardar los mismos minutos no crea otra versión', async () => {
    const { definir, plazos } = preparar();
    await definir.ejecutar({ minutos: '30' }, ADMINISTRADOR);

    const { cambio } = await definir.ejecutar(
      { minutos: ' 30' },
      ADMINISTRADOR,
    );

    expect(cambio).toBe(false);
    expect(plazos.versiones).toHaveLength(1);
  });

  it('rechaza minutos fuera de rango y dice en qué campo', async () => {
    const { definir, plazos } = preparar();

    const rechazo = definir.ejecutar({ minutos: '1441' }, ADMINISTRADOR);

    await expect(rechazo).rejects.toThrow(ReglaInvalidaError);
    await expect(rechazo).rejects.toMatchObject({
      errores: { minutos: 'Usa un número entero de minutos, de 1 a 1440.' },
    });
    expect(plazos.versiones).toHaveLength(0);
  });
});

describe('Consultar el plazo para pagar', () => {
  it('sin plazo guardado dice que rige el de 15 minutos por defecto', async () => {
    const { consultar } = preparar();

    expect(await consultar.ejecutar()).toEqual({
      historial: [],
      porDefecto: 15,
    });
  });

  it('muestra el vigente y las versiones, de la más reciente a la más antigua', async () => {
    const { definir, consultar } = preparar();
    await definir.ejecutar({ minutos: '30' }, ADMINISTRADOR);
    await definir.ejecutar({ minutos: '45' }, ADMINISTRADOR);

    const { vigente, historial } = await consultar.ejecutar();

    expect(vigente?.minutos).toBe(45);
    expect(historial.map((v) => v.minutos)).toEqual([45, 30]);
  });
});

describe('El plazo que rige para una reserva nueva', () => {
  it('sin plazo guardado son 15 minutos', async () => {
    const { vigente } = preparar();

    expect((await vigente.ejecutar()).valor).toBe(15);
  });

  it('con plazo guardado es el más reciente', async () => {
    const { definir, vigente } = preparar();
    await definir.ejecutar({ minutos: '60' }, ADMINISTRADOR);

    expect((await vigente.ejecutar()).valor).toBe(60);
  });
});
