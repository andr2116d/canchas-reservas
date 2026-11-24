import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import {
  CANCHA_REPOSITORY,
  type CanchaRepository,
} from '../../../src/modulos/canchas/dominio/cancha.repository';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import { sesionDeAdministrador } from '../../compartido/soporte/sesiones-de-prueba';
import { unaCanchaValida } from '../fabricas/datos-cancha';

describe('Canchas abiertas en dos dispositivos a la vez', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let administrador: string;
  let canchaId: number;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    administrador = await sesionDeAdministrador(app);
    const { body } = await api()
      .post('/api/canchas')
      .set('Cookie', administrador)
      .send({ canchas: [unaCanchaValida()] })
      .expect(201);
    canchaId = body[0].id;
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());

  it('un guardado hecho sobre datos ya cambiados responde conflicto en vez de pisar el otro', async () => {
    const repositorio = app.get<CanchaRepository>(CANCHA_REPOSITORY);
    const enUnDispositivo = await repositorio.buscar(canchaId);
    const enOtro = await repositorio.buscar(canchaId);
    const autoria = { ejecutadoPorId: 1, ocurridoEn: new Date() };
    enUnDispositivo!.editar(unaCanchaValida({ nota: 'Césped nuevo' }));
    await repositorio.guardar(enUnDispositivo!, { ...autoria, accion: 'EDICION' });
    enOtro!.desactivar();

    await expect(
      repositorio.guardar(enOtro!, { ...autoria, accion: 'DESACTIVACION' }),
    ).rejects.toMatchObject({
      message: 'La cancha cambió mientras se guardaba. Recarga para ver lo último.',
    });
    const fila = await prisma.cancha.findUniqueOrThrow({ where: { id: canchaId } });
    expect(fila).toMatchObject({ nota: 'Césped nuevo', estado: 'OPERATIVA' });
    expect(await prisma.cambioDeCancha.count({ where: { accion: 'DESACTIVACION' } })).toBe(0);
  });

  it('editar y desactivar a la vez no pierde ninguno de los dos cambios guardados', async () => {
    const [edicion, desactivacion] = await Promise.all([
      api()
        .put(`/api/canchas/${canchaId}`)
        .set('Cookie', administrador)
        .send(unaCanchaValida({ nota: 'Arcos nuevos' })),
      api().post(`/api/canchas/${canchaId}/desactivacion`).set('Cookie', administrador),
    ]);

    const fila = await prisma.cancha.findUniqueOrThrow({ where: { id: canchaId } });
    expect([edicion.status, desactivacion.status]).not.toContain(500);
    if (edicion.status === 200) expect(fila.nota).toBe('Arcos nuevos');
    if (desactivacion.status === 204) expect(fila.estado).toBe('DESACTIVADA');
  });

  it('eliminar desde dos dispositivos a la vez la borra una vez y al otro le dice que ya no existe', async () => {
    const respuestas = await Promise.all(
      [1, 2, 3].map(() =>
        api().delete(`/api/canchas/${canchaId}`).set('Cookie', administrador),
      ),
    );

    expect(respuestas.map((r) => r.status).sort()).toEqual([204, 404, 404]);
    expect(await prisma.cambioDeCancha.count({ where: { accion: 'ELIMINACION' } })).toBe(1);
  });
});
