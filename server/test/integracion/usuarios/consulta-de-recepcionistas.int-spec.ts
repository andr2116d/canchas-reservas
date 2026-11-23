import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { unaRecepcionistaValida } from '../../fabricas/datos-recepcionista';
import { crearAppDePrueba } from '../../soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../soporte/limpiar-tablas';
import {
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../soporte/sesiones-de-prueba';

describe('Consulta de recepcionistas', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let administrador: string;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    administrador = await sesionDeAdministrador(app);
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());

  async function crear(cambios = {}): Promise<number> {
    const { body } = await api()
      .post('/api/recepcionistas')
      .set('Cookie', administrador)
      .send(unaRecepcionistaValida(cambios))
      .expect(201);
    return body.id as number;
  }

  it('lista las activas o las desactivadas según se pida', async () => {
    await crear();
    const desactivada = await crear({
      nombres: 'Mateo',
      numeroDocumento: '47654321',
      usuarioDeCorreo: 'mateo.paz',
    });
    await prisma.usuario.update({
      where: { id: desactivada },
      data: { estado: 'INACTIVO' },
    });

    const activas = await api()
      .get('/api/recepcionistas')
      .query({ estado: 'activas' })
      .set('Cookie', administrador)
      .expect(200);
    const desactivadas = await api()
      .get('/api/recepcionistas')
      .query({ estado: 'desactivadas' })
      .set('Cookie', administrador)
      .expect(200);

    expect(
      activas.body.map((ficha: { nombres: string }) => ficha.nombres),
    ).toEqual(['Rosa']);
    expect(
      desactivadas.body.map((ficha: { nombres: string }) => ficha.nombres),
    ).toEqual(['Mateo']);
  });

  it('devuelve los datos descifrados sin hashes ni campos cifrados', async () => {
    await crear();

    const { body } = await api()
      .get('/api/recepcionistas')
      .query({ estado: 'activas' })
      .set('Cookie', administrador)
      .expect(200);

    expect(body[0]).toMatchObject({
      nombres: 'Rosa',
      apellidos: 'Quispe Lozano',
      correo: 'rosa.quispe@laprevia.pe',
      numeroDocumento: '41234567',
      estado: 'ACTIVO',
    });
    expect(JSON.stringify(body)).not.toMatch(/Hash|Cifrad|argon2/);
  });

  it('muestra la ficha con el historial y quién hizo cada acción', async () => {
    const id = await crear();

    const { body } = await api()
      .get(`/api/recepcionistas/${id}`)
      .set('Cookie', administrador)
      .expect(200);

    expect(body.ficha.celular).toBe('912345678');
    expect(body.historial).toEqual([
      {
        accion: 'ALTA',
        ocurridoEn: expect.any(String),
        ejecutadoPor: 'Valeria León Paredes',
      },
    ]);
  });

  it('responde 404 si el id no es de una recepcionista', async () => {
    await sesionDeJugador(app);
    const jugador = await prisma.usuario.findFirstOrThrow({
      where: { rol: 'JUGADOR' },
    });

    await api()
      .get(`/api/recepcionistas/${jugador.id}`)
      .set('Cookie', administrador)
      .expect(404);
    await api()
      .get('/api/recepcionistas/no-es-un-id')
      .set('Cookie', administrador)
      .expect(404);
  });

  it('responde 400 si el estado pedido no existe', async () => {
    await api()
      .get('/api/recepcionistas')
      .query({ estado: 'todas' })
      .set('Cookie', administrador)
      .expect(400);
  });

  it('responde 403 a un jugador', async () => {
    const jugador = await sesionDeJugador(app);

    await api()
      .get('/api/recepcionistas')
      .query({ estado: 'activas' })
      .set('Cookie', jugador)
      .expect(403);
  });
});
