import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { RegistrarPersonalUseCase } from '../../../src/modulos/usuarios/aplicacion/registrar-personal.use-case';
import { unaRecepcionistaValida } from '../../usuarios/fabricas/datos-recepcionista';
import { cookieDe } from '../../compartido/soporte/cookie-de-sesion';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  iniciarSesion,
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../compartido/soporte/sesiones-de-prueba';

const CORREO = 'rosa.quispe@laprevia.pe';
const TEMPORAL = 'temporal2026';

describe('Omitir el cambio de la contraseña temporal', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    const administrador = await sesionDeAdministrador(app);
    await api()
      .post('/api/recepcionistas')
      .set('Cookie', administrador)
      .send(unaRecepcionistaValida())
      .expect(201);
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());
  const omitir = (cookie: string) =>
    api().post('/api/sesiones/actual/cambio-omitido').set('Cookie', cookie);
  const panel = (cookie: string) =>
    api().get('/api/paneles/recepcion').set('Cookie', cookie);

  it('al omitirlo abre su panel en esa sesión y la consulta lo indica', async () => {
    const sesion = cookieDe(await iniciarSesion(app, CORREO, TEMPORAL));
    await panel(sesion).expect(403);

    await omitir(sesion).expect(204);

    await panel(sesion).expect(200);
    const { body } = await api()
      .get('/api/sesiones/actual')
      .set('Cookie', sesion)
      .expect(200);
    expect(body).toMatchObject({
      rol: 'RECEPCIONISTA',
      requiereCambiarContrasena: true,
      cambioOmitido: true,
    });
  });

  it('cada inicio de sesión nuevo vuelve a pedir el cambio', async () => {
    await omitir(cookieDe(await iniciarSesion(app, CORREO, TEMPORAL))).expect(
      204,
    );

    const nueva = cookieDe(await iniciarSesion(app, CORREO, TEMPORAL));

    await panel(nueva).expect(403);
  });

  it('después de omitirlo todavía puede cambiar la contraseña', async () => {
    const sesion = cookieDe(await iniciarSesion(app, CORREO, TEMPORAL));
    await omitir(sesion).expect(204);

    const cambio = await api()
      .patch('/api/sesiones/contrasena-temporal')
      .set('Cookie', sesion)
      .send({ contrasena: 'definitiva2026' })
      .expect(200);

    const { body } = await api()
      .get('/api/sesiones/actual')
      .set('Cookie', cookieDe(cambio));
    expect(body.requiereCambiarContrasena).toBe(false);
  });

  it('el administrador también puede omitirlo y gestionar recepcionistas', async () => {
    await app.get(RegistrarPersonalUseCase).ejecutar(
      {
        nombres: 'Lucía',
        apellidos: 'Ramos',
        correo: 'lucia@laprevia.pe',
        contrasena: TEMPORAL,
      },
      'ADMINISTRADOR',
    );
    const sesion = cookieDe(
      await iniciarSesion(app, 'lucia@laprevia.pe', TEMPORAL),
    );

    await omitir(sesion).expect(204);

    await api()
      .get('/api/recepcionistas')
      .query({ estado: 'activas' })
      .set('Cookie', sesion)
      .expect(200);
  });

  it('responde 403 a quien no tiene contraseña temporal', async () => {
    await omitir(await sesionDeJugador(app)).expect(403);
  });
});
