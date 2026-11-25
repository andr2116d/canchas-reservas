import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { EnMemoriaBandejaDeSalida } from '../../../../test/correo/dobles/en-memoria-bandeja-de-salida';
import { EnviadorDeCorreoDePrueba } from '../../../../test/correo/dobles/enviador-de-correo-de-prueba';
import { unCorreo } from '../../../../test/correo/fabricas/un-correo';
import { MAXIMO_DE_INTENTOS } from '../dominio/reintentos';
import { RepartirCorreosUseCase } from './repartir-correos.use-case';

describe('RepartirCorreosUseCase', () => {
  let bandeja: EnMemoriaBandejaDeSalida;
  let enviador: EnviadorDeCorreoDePrueba;
  let reloj: RelojDePrueba;
  let repartir: RepartirCorreosUseCase;

  beforeEach(() => {
    reloj = new RelojDePrueba();
    bandeja = new EnMemoriaBandejaDeSalida(reloj);
    enviador = new EnviadorDeCorreoDePrueba();
    repartir = new RepartirCorreosUseCase(bandeja, enviador, reloj);
  });

  it('envía los correos pendientes y los marca como enviados', async () => {
    await bandeja.encolar(unCorreo({ para: 'valeria.leon@gmail.com' }));

    await repartir.ejecutar();

    expect(enviador.enviados.map((c) => c.para)).toEqual([
      'valeria.leon@gmail.com',
    ]);
    expect(bandeja.estadoDe(1)).toEqual({
      estado: 'ENVIADO',
      intentos: 1,
      enviadoEn: reloj.ahora(),
    });
  });

  it('no vuelve a enviar un correo ya enviado', async () => {
    await bandeja.encolar(unCorreo());
    await repartir.ejecutar();

    await repartir.ejecutar();

    expect(enviador.enviados).toHaveLength(1);
  });

  it('si el envío falla, lo reintenta más tarde y no antes', async () => {
    await bandeja.encolar(unCorreo());
    enviador.fallarLasProximas(1);

    await repartir.ejecutar();
    await repartir.ejecutar();
    reloj.avanzarMinutos(1);
    await repartir.ejecutar();

    expect(enviador.enviados).toHaveLength(1);
    expect(bandeja.estadoDe(1)).toMatchObject({
      estado: 'ENVIADO',
      intentos: 2,
    });
  });

  it('tras el máximo de intentos fallidos lo deja como fallido con el error', async () => {
    await bandeja.encolar(unCorreo());
    enviador.fallarLasProximas(MAXIMO_DE_INTENTOS);

    for (let intento = 0; intento < MAXIMO_DE_INTENTOS; intento++) {
      await repartir.ejecutar();
      reloj.avanzarMinutos(180);
    }
    await repartir.ejecutar();

    expect(bandeja.estadoDe(1)).toEqual({
      estado: 'FALLIDO',
      intentos: MAXIMO_DE_INTENTOS,
      ultimoError: 'El servidor de correo no respondió.',
    });
    expect(enviador.enviados).toHaveLength(0);
  });

  it('un correo que falla no detiene a los demás', async () => {
    await bandeja.encolar(unCorreo({ para: 'uno@gmail.com' }));
    await bandeja.encolar(unCorreo({ para: 'dos@gmail.com' }));
    enviador.fallarLasProximas(1);

    await repartir.ejecutar();

    expect(enviador.enviados.map((c) => c.para)).toEqual(['dos@gmail.com']);
  });

  it('dos repartos a la vez no envían dos veces el mismo correo', async () => {
    await bandeja.encolar(unCorreo());

    await Promise.all([repartir.ejecutar(), repartir.ejecutar()]);

    expect(enviador.enviados).toHaveLength(1);
  });
});
