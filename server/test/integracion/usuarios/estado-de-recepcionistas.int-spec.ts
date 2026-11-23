import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { unaRecepcionistaValida } from '../../fabricas/datos-recepcionista';
import { cookieDe } from '../../soporte/cookie-de-sesion';
import { crearAppDePrueba } from '../../soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../soporte/limpiar-tablas';
import {
  iniciarSesion,
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../soporte/sesiones-de-prueba';

const CORREO = 'rosa.quispe@laprevia.pe';

describe('Desactivar, reactivar y restablecer la contraseña de recepcionistas', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let administrador: string;
  let id: number;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    administrador = await sesionDeAdministrador(app);
    const { body } = await api()
      .post('/api/recepcionistas')
      .set('Cookie', administrador)
      .send(unaRecepcionistaValida())
      .expect(201);
    id = body.id as number;
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());
  const accion = (nombre: string, cuerpo: object = {}) =>
    api().post(`/api/recepcionistas/${id}/${nombre}`).send(cuerpo);
  const historial = async () => {
    const { body } = await api()
      .get(`/api/recepcionistas/${id}`)
      .set('Cookie', administrador);
    return body.historial.map((a: { accion: string }) => a.accion);
  };

  it('una cuenta desactivada no inicia sesión, pierde sus sesiones y pasa al listado de desactivadas', async () => {
    const sesion = cookieDe(await iniciarSesion(app, CORREO, 'temporal2026'));

    await accion('desactivacion').set('Cookie', administrador).expect(204);

    const inicio = await iniciarSesion(app, CORREO, 'temporal2026');
    expect(inicio.status).toBe(403);
    expect(inicio.body.mensaje).toContain('inactiva');
    await api().get('/api/sesiones/actual').set('Cookie', sesion).expect(401);
    expect(await prisma.sesion.count({ where: { usuarioId: id } })).toBe(0);
    const { body } = await api()
      .get('/api/recepcionistas')
      .query({ estado: 'desactivadas' })
      .set('Cookie', administrador);
    expect(body.map((ficha: { id: number }) => ficha.id)).toEqual([id]);
    expect(await historial()).toEqual(['DESACTIVACION', 'ALTA']);
  });

  it('desactivar dos veces responde 409 sin repetir la acción', async () => {
    await accion('desactivacion').set('Cookie', administrador).expect(204);

    const otra = await accion('desactivacion').set('Cookie', administrador);

    expect(otra.status).toBe(409);
    expect(otra.body.mensaje).toBe('Esta cuenta ya está desactivada.');
    expect(await historial()).toEqual(['DESACTIVACION', 'ALTA']);
  });

  it('la reactivación conserva el historial y exige la temporal nueva', async () => {
    await accion('desactivacion').set('Cookie', administrador).expect(204);

    await accion('reactivacion', { contrasena: 'nueva2026' })
      .set('Cookie', administrador)
      .expect(204);

    await iniciarSesion(app, CORREO, 'temporal2026').expect(401);
    const inicio = await iniciarSesion(app, CORREO, 'nueva2026').expect(200);
    expect(inicio.body.requiereCambiarContrasena).toBe(true);
    expect(await historial()).toEqual([
      'REACTIVACION',
      'DESACTIVACION',
      'ALTA',
    ]);
  });

  it('restablecer la contraseña invalida la anterior y cierra sus sesiones', async () => {
    const sesion = cookieDe(await iniciarSesion(app, CORREO, 'temporal2026'));

    await accion('restablecimiento-de-contrasena', { contrasena: 'nueva2026' })
      .set('Cookie', administrador)
      .expect(204);

    await api().get('/api/sesiones/actual').set('Cookie', sesion).expect(401);
    await iniciarSesion(app, CORREO, 'temporal2026').expect(401);
    const inicio = await iniciarSesion(app, CORREO, 'nueva2026').expect(200);
    expect(inicio.body.requiereCambiarContrasena).toBe(true);
    expect(await historial()).toEqual([
      'RESTABLECIMIENTO_DE_CONTRASENA',
      'ALTA',
    ]);
  });

  it('responde 400 si la contraseña temporal no es válida', async () => {
    const respuesta = await accion('restablecimiento-de-contrasena', {
      contrasena: 'corta',
    })
      .set('Cookie', administrador)
      .expect(400);

    expect(Object.keys(respuesta.body.errores)).toEqual(['contrasena']);
  });

  it('responde 404 si la recepcionista no existe', async () => {
    await api()
      .post('/api/recepcionistas/9999/desactivacion')
      .set('Cookie', administrador)
      .expect(404);
  });

  it('responde 403 a un jugador y 401 sin sesión', async () => {
    const jugador = await sesionDeJugador(app);

    await accion('desactivacion').set('Cookie', jugador).expect(403);
    await accion('desactivacion').expect(401);
    expect(await historial()).toEqual(['ALTA']);
  });
});
