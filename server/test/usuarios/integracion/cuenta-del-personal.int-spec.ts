import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { cookieDe } from '../../compartido/soporte/cookie-de-sesion';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  administradorSinDatos,
  iniciarSesion,
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../compartido/soporte/sesiones-de-prueba';
import { datosDelAdministrador } from '../fabricas/datos-del-personal';
import { unaRecepcionistaValida } from '../fabricas/datos-recepcionista';

describe('Cuenta del personal', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());

  describe('mi cuenta', () => {
    it('el administrador cambia su correo dentro del dominio y cierra sus otras sesiones', async () => {
      const sesion = await sesionDeAdministrador(app);
      const otra = cookieDe(
        await iniciarSesion(
          app,
          'administracion@laprevia.pe',
          'definitiva2026',
        ),
      );

      const fuera = await api()
        .patch('/api/cuenta')
        .set('Cookie', sesion)
        .send({ correo: 'jefa@gmail.com' })
        .expect(400);
      await api()
        .patch('/api/cuenta')
        .set('Cookie', sesion)
        .send({ correo: 'direccion@laprevia.pe', nombres: 'Valeria Inés' })
        .expect(204);

      expect(Object.keys(fuera.body.errores)).toEqual(['correo']);
      await api().get('/api/cuenta').set('Cookie', otra).expect(401);
      const { body } = await api()
        .get('/api/cuenta')
        .set('Cookie', sesion)
        .expect(200);
      expect(body).toMatchObject({
        correo: 'direccion@laprevia.pe',
        nombres: 'Valeria Inés',
      });
    });

    it('pasa de DNI a carné de extranjería una sola vez', async () => {
      const sesion = await administradorSinDatos(app);
      await api()
        .post('/api/cuenta/datos')
        .set('Cookie', sesion)
        .send(datosDelAdministrador())
        .expect(204);
      await api()
        .post('/api/sesiones/actual/cambio-omitido')
        .set('Cookie', sesion)
        .expect(204);
      const cambio = {
        tipoDocumento: 'CARNE_EXTRANJERIA',
        numeroDocumento: '001234567',
        aceptaAviso: true,
      };

      await api()
        .patch('/api/cuenta/documento')
        .set('Cookie', sesion)
        .send(cambio)
        .expect(204);
      const segunda = await api()
        .patch('/api/cuenta/documento')
        .set('Cookie', sesion)
        .send({ ...cambio, tipoDocumento: 'DNI', numeroDocumento: '45678912' })
        .expect(409);

      expect(segunda.body.mensaje).toContain('ya se cambió una vez');
      const { body } = await api()
        .get('/api/cuenta')
        .set('Cookie', sesion)
        .expect(200);
      expect(body).toMatchObject({
        tipoDocumento: 'CARNE_EXTRANJERIA',
        puedeCambiarTipoDeDocumento: false,
      });
    });

    it('no deja cambiar la contraseña más de 5 veces en una hora', async () => {
      let sesion = await sesionDeJugador(app);
      const claves = [
        'pichanga10',
        'clave2026a',
        'clave2026b',
        'clave2026c',
        'clave2026d',
        'clave2026e',
      ];
      for (let vez = 0; vez < 5; vez++) {
        const respuesta = await api()
          .patch('/api/cuenta/contrasena')
          .set('Cookie', sesion)
          .send({ actual: claves[vez], contrasena: claves[vez + 1] })
          .expect(200);
        sesion = cookieDe(respuesta);
      }

      const { body } = await api()
        .patch('/api/cuenta/contrasena')
        .set('Cookie', sesion)
        .send({ actual: claves[5], contrasena: 'otra2026zz' })
        .expect(429);
      expect(body.mensaje).toContain('5 veces en la última hora');
    });

    it('los cambios propios del personal quedan en el historial; los de jugadores, no', async () => {
      const sesion = await sesionDeAdministrador(app);
      const jugador = await sesionDeJugador(app);
      await api()
        .patch('/api/cuenta')
        .set('Cookie', sesion)
        .send({ celular: '911222333' })
        .expect(204);
      await api()
        .patch('/api/cuenta')
        .set('Cookie', jugador)
        .send({ celular: '911222334' })
        .expect(204);

      const { body } = await api()
        .get('/api/historial')
        .query({ categoria: 'CUENTAS' })
        .set('Cookie', sesion)
        .expect(200);

      // El cambio de su contraseña temporal también es suyo; el celular del jugador no aparece.
      expect(body.registros.map((r: { accion: string }) => r.accion)).toEqual([
        'EDICION_PROPIA',
        'CAMBIO_DE_CONTRASENA',
      ]);
    });
  });

  it('el administrador no puede cambiar el documento de una recepcionista', async () => {
    const admin = await sesionDeAdministrador(app);
    const { body } = await api()
      .post('/api/recepcionistas')
      .set('Cookie', admin)
      .send(unaRecepcionistaValida())
      .expect(201);
    const { contrasena: _, ...datos } = unaRecepcionistaValida({
      numeroDocumento: '49999999',
    });

    const respuesta = await api()
      .patch(`/api/recepcionistas/${body.id}`)
      .set('Cookie', admin)
      .send(datos)
      .expect(400);

    expect(respuesta.body.errores).toEqual({
      numeroDocumento:
        'El documento identifica a la persona y no se puede cambiar.',
    });
  });

  it('sin sesión responde 401 y un jugador no completa datos ni cambia su documento', async () => {
    const jugador = await sesionDeJugador(app);

    for (const [metodo, ruta] of [
      ['get', '/api/cuenta/datos'],
      ['post', '/api/cuenta/datos'],
      ['patch', '/api/cuenta/documento'],
    ] as const)
      await api()[metodo](ruta).expect(401);
    await api()
      .post('/api/cuenta/datos')
      .set('Cookie', jugador)
      .send(datosDelAdministrador())
      .expect(403);
    await api()
      .patch('/api/cuenta/documento')
      .set('Cookie', jugador)
      .send({
        tipoDocumento: 'CARNE_EXTRANJERIA',
        numeroDocumento: '001234567',
        aceptaAviso: true,
      })
      .expect(400);
  });
});
