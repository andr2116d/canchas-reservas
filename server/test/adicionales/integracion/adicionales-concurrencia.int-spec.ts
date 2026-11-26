import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import {
  ADICIONAL_REPOSITORY,
  type AdicionalRepository,
} from '../../../src/modulos/adicionales/dominio/adicional.repository';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import { sesionDeAdministrador } from '../../compartido/soporte/sesiones-de-prueba';
import { unAdicionalValido } from '../fabricas/datos-adicional';

describe('Adicionales abiertos en dos dispositivos a la vez', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let administrador: string;
  let adicionalId: number;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    administrador = await sesionDeAdministrador(app);
    const { body } = await api()
      .post('/api/adicionales')
      .set('Cookie', administrador)
      .send(unAdicionalValido())
      .expect(201);
    adicionalId = body.id;
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());

  it('un guardado hecho sobre datos ya cambiados responde conflicto en vez de pisar el precio', async () => {
    const repositorio = app.get<AdicionalRepository>(ADICIONAL_REPOSITORY);
    const enUnDispositivo = await repositorio.buscar(adicionalId);
    const enOtro = await repositorio.buscar(adicionalId);
    const autoria = { ejecutadoPorId: 1, ocurridoEn: new Date() };
    enUnDispositivo!.editar(unAdicionalValido({ precio: '50.00' }));
    await repositorio.guardar(enUnDispositivo!, {
      ...autoria,
      accion: 'EDICION',
    });
    enOtro!.desactivar();

    await expect(
      repositorio.guardar(enOtro!, { ...autoria, accion: 'DESACTIVACION' }),
    ).rejects.toMatchObject({
      message:
        'El adicional cambió mientras se guardaba. Recarga para ver lo último.',
    });
    const fila = await prisma.adicional.findUniqueOrThrow({
      where: { id: adicionalId },
    });
    expect(fila.precio.toFixed(2)).toBe('50.00');
    expect(fila.estado).toBe('ACTIVO');
  });

  it('eliminar desde dos dispositivos a la vez lo borra una vez y al otro le dice que ya no existe', async () => {
    const respuestas = await Promise.all(
      [1, 2, 3].map(() =>
        api()
          .delete(`/api/adicionales/${adicionalId}`)
          .set('Cookie', administrador),
      ),
    );

    expect(respuestas.map((r) => r.status).sort((a, b) => a - b)).toEqual([
      204, 404, 404,
    ]);
    expect(
      await prisma.cambioDeAdicional.count({
        where: { accion: 'ELIMINACION' },
      }),
    ).toBe(1);
  });
});
