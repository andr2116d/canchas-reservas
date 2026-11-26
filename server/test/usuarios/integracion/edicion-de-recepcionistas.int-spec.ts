import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { unaRecepcionistaValida } from '../fabricas/datos-recepcionista';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../compartido/soporte/sesiones-de-prueba';

function datosEditados(cambios = {}) {
  const { contrasena: _, ...datos } = unaRecepcionistaValida(cambios);
  return datos;
}

describe('PATCH /api/recepcionistas/:id', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let administrador: string;
  let id: number;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    administrador = await sesionDeAdministrador(app);
    id = await crear();
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

  const editar = (destino: number | string, cambios = {}) =>
    api().patch(`/api/recepcionistas/${destino}`).send(datosEditados(cambios));

  it('responde 204, guarda los datos cifrados y deja la edición en la auditoría', async () => {
    await editar(id, { celular: '987000111', usuarioDeCorreo: 'rosa.q' })
      .set('Cookie', administrador)
      .expect(204);

    const { body } = await api()
      .get(`/api/recepcionistas/${id}`)
      .set('Cookie', administrador)
      .expect(200);
    expect(body.ficha).toMatchObject({
      celular: '987000111',
      correo: 'rosa.q@laprevia.pe',
    });
    expect(body.historial.map((a: { accion: string }) => a.accion)).toEqual([
      'EDICION',
      'ALTA',
    ]);
    const fila = await prisma.usuario.findUniqueOrThrow({ where: { id } });
    expect(fila.celularCifrado).not.toContain('987000111');
  });

  it('la recepcionista entra con el correo nuevo', async () => {
    await editar(id, { usuarioDeCorreo: 'rosa.q' })
      .set('Cookie', administrador)
      .expect(204);

    await api()
      .post('/api/sesiones')
      .send({ correo: 'rosa.q@laprevia.pe', contrasena: 'temporal2026' })
      .expect(200);
  });

  it('responde 409 si el documento o el correo son de otra cuenta del personal', async () => {
    await crear({ numeroDocumento: '47654321', usuarioDeCorreo: 'mateo.paz' });

    const respuesta = await editar(id, { usuarioDeCorreo: 'mateo.paz' })
      .set('Cookie', administrador)
      .expect(409);

    expect(respuesta.body.errores).toEqual({
      correo: 'Este correo ya fue registrado para otra cuenta del personal.',
    });
  });

  it('responde 404 si la recepcionista no existe y 400 si un dato es inválido', async () => {
    await editar(9999).set('Cookie', administrador).expect(404);
    await editar(id, { celular: '12' })
      .set('Cookie', administrador)
      .expect(400);
  });

  it('no permite cambiar el rol', async () => {
    await api()
      .patch(`/api/recepcionistas/${id}`)
      .set('Cookie', administrador)
      .send({ ...datosEditados(), rol: 'ADMINISTRADOR' })
      .expect(400);
  });

  it('responde 403 a un jugador', async () => {
    const jugador = await sesionDeJugador(app);

    await editar(id).set('Cookie', jugador).expect(403);
  });
});
