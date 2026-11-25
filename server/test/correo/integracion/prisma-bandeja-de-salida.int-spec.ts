import { randomBytes } from 'node:crypto';
import { AesGcmCifradorAdapter } from '../../../src/compartido/infraestructura/cifrado/aes-gcm-cifrador.adapter';
import { leerConfiguracion } from '../../../src/compartido/infraestructura/configuracion/configuracion';
import { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { PrismaBandejaDeSalidaAdapter } from '../../../src/modulos/correo/infraestructura/persistencia/prisma-bandeja-de-salida.adapter';
import { RelojDePrueba } from '../../compartido/dobles/reloj-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import { unCorreo } from '../fabricas/un-correo';

describe('PrismaBandejaDeSalidaAdapter', () => {
  const configuracion = leerConfiguracion({
    ...process.env,
    CLAVE_CIFRADO: randomBytes(32).toString('base64'),
    CLAVE_HASH: randomBytes(32).toString('base64'),
  });
  const prisma = new PrismaService(configuracion);
  const reloj = new RelojDePrueba();
  const bandeja = new PrismaBandejaDeSalidaAdapter(
    prisma,
    new AesGcmCifradorAdapter(
      configuracion.claveCifrado,
      configuracion.claveHash,
    ),
    reloj,
  );

  beforeEach(() => limpiarTablas(prisma));
  afterAll(() => prisma.$disconnect());

  it('guarda el destinatario y los cuerpos cifrados, nunca en texto plano', async () => {
    await bandeja.encolar(unCorreo({ para: 'valeria.leon@gmail.com' }));

    const fila = await prisma.correoSaliente.findFirstOrThrow();
    expect(fila).toMatchObject({
      estado: 'PENDIENTE',
      intentos: 0,
      asunto: 'Hoja de reclamación N.º 000001-2026',
    });
    expect(JSON.stringify(fila)).not.toContain('valeria.leon');
    expect(JSON.stringify(fila)).not.toContain('Registramos tu hoja');
  });

  it('toma los pendientes descifrados, les suma un intento y no los vuelve a dar mientras están reservados', async () => {
    await bandeja.encolar(unCorreo());

    const tomados = await bandeja.tomarPendientes(reloj.ahora(), 10);
    const deNuevo = await bandeja.tomarPendientes(reloj.ahora(), 10);

    expect(tomados).toEqual([{ id: 1, intentos: 1, ...unCorreo() }]);
    expect(deNuevo).toEqual([]);
  });

  it('no da los enviados ni los fallidos, y sí los reprogramados cuando llega su hora', async () => {
    for (let i = 0; i < 3; i++) await bandeja.encolar(unCorreo());
    await bandeja.tomarPendientes(reloj.ahora(), 10);
    await bandeja.marcarEnviado(1, reloj.ahora());
    await bandeja.marcarFallido(2, 'Buzón inexistente.');
    reloj.avanzarMinutos(1);
    await bandeja.reprogramar(3, reloj.ahora(), 'El servidor no respondió.');

    const tomados = await bandeja.tomarPendientes(reloj.ahora(), 10);

    expect(tomados.map((c) => [c.id, c.intentos])).toEqual([[3, 2]]);
  });

  it('dos repartos a la vez se llevan correos distintos', async () => {
    for (let i = 0; i < 6; i++) await bandeja.encolar(unCorreo());

    const [uno, otro] = await Promise.all([
      bandeja.tomarPendientes(reloj.ahora(), 3),
      bandeja.tomarPendientes(reloj.ahora(), 3),
    ]);

    const ids = [...uno, ...otro].map((c) => c.id).sort((a, b) => a - b);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(0);
  });
});
