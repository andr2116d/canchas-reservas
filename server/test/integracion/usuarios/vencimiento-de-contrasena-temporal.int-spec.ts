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
} from '../../soporte/sesiones-de-prueba';

const CORREO = 'rosa.quispe@laprevia.pe';
const SIETE_DIAS = 7 * 24 * 60 * 60 * 1000;

describe('Vencimiento de la contraseña temporal', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let id: number;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    const administrador = await sesionDeAdministrador(app);
    const { body } = await request(app.getHttpServer())
      .post('/api/recepcionistas')
      .set('Cookie', administrador)
      .send(unaRecepcionistaValida())
      .expect(201);
    id = body.id as number;
  });
  afterEach(() => app.close());

  it('la contraseña temporal sirve 7 días y el inicio de sesión lo informa', async () => {
    const antes = Date.now();

    const inicio = await iniciarSesion(app, CORREO, 'temporal2026').expect(200);

    const vence = Date.parse(inicio.body.contrasenaTemporalVenceEn);
    expect(vence).toBeGreaterThanOrEqual(antes + SIETE_DIAS - 1000);
    expect(vence).toBeLessThanOrEqual(Date.now() + SIETE_DIAS);
    const { body } = await request(app.getHttpServer())
      .get('/api/sesiones/actual')
      .set('Cookie', cookieDe(inicio))
      .expect(200);
    expect(body.contrasenaTemporalVenceEn).toBe(
      inicio.body.contrasenaTemporalVenceEn,
    );
  });

  it('con la temporal vencida no inicia sesión y pide una nueva', async () => {
    await prisma.usuario.update({
      where: { id },
      data: { contrasenaTemporalVenceEn: new Date(Date.now() - 1000) },
    });

    const inicio = await iniciarSesion(app, CORREO, 'temporal2026');

    expect(inicio.status).toBe(403);
    expect(inicio.body.mensaje).toBe(
      'La contraseña temporal venció. Pide una nueva a administración.',
    );
    expect(inicio.headers['set-cookie']).toBeUndefined();
  });

  it('una temporal vencida no se confunde con una contraseña incorrecta', async () => {
    await prisma.usuario.update({
      where: { id },
      data: { contrasenaTemporalVenceEn: new Date(Date.now() - 1000) },
    });

    await iniciarSesion(app, CORREO, 'otra2026').expect(401);
  });

  it('al cambiarla deja de vencer', async () => {
    const inicio = await iniciarSesion(app, CORREO, 'temporal2026');

    await request(app.getHttpServer())
      .patch('/api/sesiones/contrasena-temporal')
      .set('Cookie', cookieDe(inicio))
      .send({ contrasena: 'definitiva2026' })
      .expect(200);

    const fila = await prisma.usuario.findUniqueOrThrow({ where: { id } });
    expect(fila.contrasenaTemporalVenceEn).toBeNull();
  });
});
