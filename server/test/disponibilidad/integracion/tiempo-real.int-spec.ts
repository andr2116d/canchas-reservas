import type { AddressInfo } from 'node:net';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { io, type Socket } from 'socket.io-client';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { RUTA_DEL_TIEMPO_REAL } from '../../../src/compartido/infraestructura/tiempo-real/ruta-del-tiempo-real';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';

describe('Avisos del mapa de turnos en tiempo real', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let navegador: Socket;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    await app.listen(0);
    const { port } = app.getHttpServer().address() as AddressInfo;
    navegador = io(`http://localhost:${port}/disponibilidad`, {
      path: RUTA_DEL_TIEMPO_REAL,
      addTrailingSlash: false,
      transports: ['websocket'],
    });
    await new Promise<void>((listo) =>
      navegador.once('connect', () => listo()),
    );
  });
  afterEach(async () => {
    navegador.close();
    await app.close();
  });

  const proximoAviso = () =>
    new Promise<void>((avisado) => navegador.once('cambio', () => avisado()));

  it('avisa a los navegadores conectados cuando cambia una cancha', async () => {
    const aviso = proximoAviso();

    await prisma.cancha.create({
      data: {
        nombre: 'Cancha 9',
        nombreNormalizado: 'cancha 9',
        tipo: 'FUTBOL_5',
        tieneIluminacion: true,
      },
    });

    await expect(aviso).resolves.toBeUndefined();
  });

  it('ignora lo que envía un navegador y sigue avisando', async () => {
    navegador.emit('reservar', { canchaId: 1 });
    const aviso = proximoAviso();

    await prisma.adelantoMinimo.create({
      data: {
        porcentaje: 50,
        guardadoPor: {
          create: {
            nombresCifrado: 'x',
            apellidosCifrado: 'x',
            correoCifrado: 'x',
            correoHash: 'x',
            contrasenaHash: 'x',
            rol: 'ADMINISTRADOR',
            estado: 'ACTIVO',
          },
        },
      },
    });

    await expect(aviso).resolves.toBeUndefined();
  });

  it('corta la conexión de un navegador que envía un mensaje demasiado grande', async () => {
    const cortada = new Promise<string>((listo) =>
      navegador.once('disconnect', listo),
    );

    navegador.emit('x', 'x'.repeat(2000));

    await expect(cortada).resolves.toBe('transport close');
  });
});
