import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { cookieDe } from '../../compartido/soporte/cookie-de-sesion';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  administradorSinDatos,
  CONTRASENA_TEMPORAL,
  iniciarSesion,
  sesionDeAdministrador,
} from '../../compartido/soporte/sesiones-de-prueba';
import { datosDelAdministrador } from '../fabricas/datos-del-personal';
import { unaRecepcionistaValida } from '../fabricas/datos-recepcionista';

describe('Primer ingreso del personal', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());

  it('el administrador completa sus datos, cifrados, y recién entonces cambia la contraseña', async () => {
    const sesion = await administradorSinDatos(app);

    await api()
      .patch('/api/sesiones/contrasena-temporal')
      .set('Cookie', sesion)
      .send({ contrasena: 'definitiva2026' })
      .expect(403);
    await api()
      .post('/api/cuenta/datos')
      .set('Cookie', sesion)
      .send(datosDelAdministrador())
      .expect(204);

    const fila = await prisma.usuario.findFirstOrThrow({
      where: { rol: 'ADMINISTRADOR' },
    });
    expect(fila.numeroDocumentoCifrado).not.toContain('45678912');
    expect(fila.datosConfirmadosEn).not.toBeNull();
    const actual = await api()
      .get('/api/sesiones/actual')
      .set('Cookie', sesion)
      .expect(200);
    expect(actual.body).toMatchObject({
      requiereCompletarDatos: false,
      requiereCambiarContrasena: true,
    });
    await api()
      .patch('/api/sesiones/contrasena-temporal')
      .set('Cookie', sesion)
      .send({ contrasena: 'definitiva2026' })
      .expect(200);
  });

  it('si falta un dato o es menor de edad, no guarda nada y dice qué corregir', async () => {
    const sesion = await administradorSinDatos(app);

    const { body } = await api()
      .post('/api/cuenta/datos')
      .set('Cookie', sesion)
      .send({
        ...datosDelAdministrador(),
        fechaNacimiento: '2015-01-01',
        celular: '',
      })
      .expect(400);

    expect(Object.keys(body.errores)).toEqual(['fechaNacimiento', 'celular']);
  });

  it('la recepcionista ve lo que cargó administración y confirma sin cambiar su documento', async () => {
    const admin = await sesionDeAdministrador(app);
    await api()
      .post('/api/recepcionistas')
      .set('Cookie', admin)
      .send(unaRecepcionistaValida())
      .expect(201);
    const sesion = cookieDe(
      await iniciarSesion(app, 'rosa.quispe@laprevia.pe', CONTRASENA_TEMPORAL),
    );

    const { body } = await api()
      .get('/api/cuenta/datos')
      .set('Cookie', sesion)
      .expect(200);
    const otroDocumento = await api()
      .post('/api/cuenta/datos')
      .set('Cookie', sesion)
      .send({ ...datosDelAdministrador(), numeroDocumento: '49999999' })
      .expect(400);
    await api()
      .post('/api/cuenta/datos')
      .set('Cookie', sesion)
      .send({
        nombres: 'Rosa Elena',
        apellidos: body.apellidos,
        fechaNacimiento: body.fechaNacimiento,
        celular: body.celular,
      })
      .expect(204);

    expect(body).toMatchObject({
      nombres: 'Rosa',
      numeroDocumento: '41234567',
    });
    expect(otroDocumento.body.errores).toEqual({
      numeroDocumento:
        'El documento identifica a la persona y no se puede cambiar.',
    });
  });

  it('confirmar dos veces no se puede: el paso ya no está disponible', async () => {
    const sesion = await administradorSinDatos(app);
    await api()
      .post('/api/cuenta/datos')
      .set('Cookie', sesion)
      .send(datosDelAdministrador())
      .expect(204);

    await api()
      .post('/api/cuenta/datos')
      .set('Cookie', sesion)
      .send(datosDelAdministrador())
      .expect(403);
  });
});
