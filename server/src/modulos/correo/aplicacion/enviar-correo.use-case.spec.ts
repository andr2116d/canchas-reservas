import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { EnMemoriaBandejaDeSalida } from '../../../../test/correo/dobles/en-memoria-bandeja-de-salida';
import { EnviadorDeCorreoDePrueba } from '../../../../test/correo/dobles/enviador-de-correo-de-prueba';
import { unCorreo } from '../../../../test/correo/fabricas/un-correo';
import { EnviarCorreoUseCase } from './enviar-correo.use-case';
import { RepartoDeCorreos } from './reparto-de-correos';
import { RepartirCorreosUseCase } from './repartir-correos.use-case';

describe('EnviarCorreoUseCase', () => {
  let bandeja: EnMemoriaBandejaDeSalida;
  let enviador: EnviadorDeCorreoDePrueba;
  let reparto: RepartoDeCorreos;
  let enviar: EnviarCorreoUseCase;
  let errores: unknown[];

  beforeEach(() => {
    const reloj = new RelojDePrueba();
    bandeja = new EnMemoriaBandejaDeSalida(reloj);
    enviador = new EnviadorDeCorreoDePrueba();
    errores = [];
    reparto = new RepartoDeCorreos(
      new RepartirCorreosUseCase(bandeja, enviador, reloj),
      (error) => errores.push(error),
    );
    enviar = new EnviarCorreoUseCase(bandeja, reparto);
  });

  it('guarda el correo en la bandeja y lo envía enseguida', async () => {
    await enviar.ejecutar(unCorreo({ para: 'valeria.leon@gmail.com' }));
    await reparto.disparar();

    expect(bandeja.correos).toEqual([
      unCorreo({ para: 'valeria.leon@gmail.com' }),
    ]);
    expect(enviador.enviados.map((c) => c.para)).toEqual([
      'valeria.leon@gmail.com',
    ]);
  });

  it('si el servidor de correo falla, no lo traslada a quien pidió el envío', async () => {
    enviador.fallarLasProximas(1);

    await expect(enviar.ejecutar(unCorreo())).resolves.toBeUndefined();
    await reparto.disparar();

    expect(bandeja.estadoDe(1)).toMatchObject({
      estado: 'PENDIENTE',
      intentos: 1,
    });
  });
});

describe('RepartoDeCorreos', () => {
  it('no corre dos repartos a la vez: el pedido que llega durante uno hace una vuelta más', async () => {
    let vueltas = 0;
    let soltar: () => void = () => undefined;
    const repartir = {
      ejecutar: () => {
        vueltas++;
        return new Promise<void>((listo) => (soltar = listo));
      },
    };
    const reparto = new RepartoDeCorreos(repartir, () => undefined);

    const primero = reparto.disparar();
    void reparto.disparar();
    void reparto.disparar();
    soltar();
    await new Promise((listo) => setImmediate(listo));
    soltar();
    await primero;

    expect(vueltas).toBe(2);
  });

  it('avisa del error de una vuelta y sigue disponible para la siguiente', async () => {
    const errores: unknown[] = [];
    let falla = true;
    const repartir = {
      ejecutar: () =>
        falla ? Promise.reject(new Error('Base caída.')) : Promise.resolve(),
    };
    const reparto = new RepartoDeCorreos(repartir, (error) =>
      errores.push(error),
    );

    await reparto.disparar();
    falla = false;
    await reparto.disparar();

    expect(errores).toEqual([new Error('Base caída.')]);
  });

  it('al detenerse espera la vuelta en curso y ya no empieza otras', async () => {
    let vueltas = 0;
    let soltar: () => void = () => undefined;
    const repartir = {
      ejecutar: () => {
        vueltas++;
        return new Promise<void>((listo) => (soltar = listo));
      },
    };
    const reparto = new RepartoDeCorreos(repartir, () => undefined);
    void reparto.disparar();

    const detenido = reparto.detener();
    void reparto.disparar();
    soltar();
    await detenido;
    await reparto.disparar();

    expect(vueltas).toBe(1);
  });
});
