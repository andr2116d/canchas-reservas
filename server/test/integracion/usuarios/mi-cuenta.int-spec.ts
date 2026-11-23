import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { unaRecepcionistaValida } from '../../fabricas/datos-recepcionista';
import { unJugadorValido } from '../../fabricas/datos-registro-jugador';
import { cookieDe } from '../../soporte/cookie-de-sesion';
import { crearAppDePrueba } from '../../soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../soporte/limpiar-tablas';
import {
  iniciarSesion,
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../soporte/sesiones-de-prueba';

describe('Mi cuenta', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let jugador: string;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    jugador = await sesionDeJugador(app);
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());

  async function sesionDeRecepcionista(): Promise<string> {
    const administrador = await sesionDeAdministrador(app);
    await api()
      .post('/api/recepcionistas')
      .set('Cookie', administrador)
      .send(unaRecepcionistaValida())
      .expect(201);
    const sesion = cookieDe(
      await iniciarSesion(app, 'rosa.quispe@laprevia.pe', 'temporal2026'),
    );
    await api()
      .post('/api/sesiones/actual/cambio-omitido')
      .set('Cookie', sesion)
      .expect(204);
    return sesion;
  }

  it('muestra los propios datos y lo que se puede cambiar, sin hashes ni cifrados', async () => {
    const { body } = await api()
      .get('/api/cuenta')
      .set('Cookie', jugador)
      .expect(200);

    expect(body).toMatchObject({
      rol: 'JUGADOR',
      nombres: 'Valeria',
      numeroDocumento: '45678912',
      correo: 'valeria.leon@gmail.com',
      editables: ['correo', 'celular', 'dorsal'],
    });
    expect(JSON.stringify(body)).not.toMatch(/Hash|Cifrad|argon2/);
  });

  it('la recepcionista ve su cuenta y solo puede cambiar el celular', async () => {
    const recepcion = await sesionDeRecepcionista();

    const { body } = await api()
      .get('/api/cuenta')
      .set('Cookie', recepcion)
      .expect(200);

    expect(body).toMatchObject({
      rol: 'RECEPCIONISTA',
      editables: ['celular'],
    });
    const respuesta = await api()
      .patch('/api/cuenta')
      .set('Cookie', recepcion)
      .send({ correo: 'otra@laprevia.pe' })
      .expect(400);
    expect(respuesta.body.errores).toEqual({
      correo: 'Este dato no se puede cambiar desde la cuenta.',
    });
  });

  it('el jugador cambia su correo, su celular y su dorsal, y entra con el correo nuevo', async () => {
    await api()
      .patch('/api/cuenta')
      .set('Cookie', jugador)
      .send({ correo: 'nueva@gmail.com', celular: '912000111', dorsal: '7' })
      .expect(204);

    const fila = await prisma.usuario.findFirstOrThrow({
      where: { rol: 'JUGADOR' },
    });
    expect(fila.celularCifrado).not.toContain('912000111');
    expect(fila.dorsal).toBe(7);
    await iniciarSesion(
      app,
      'nueva@gmail.com',
      unJugadorValido().contrasena,
    ).expect(200);
  });

  it('no deja cambiar los datos que identifican a la persona', async () => {
    await api()
      .patch('/api/cuenta')
      .set('Cookie', jugador)
      .send({ nombres: 'Otra', numeroDocumento: '11223344' })
      .expect(400);
  });

  it('responde 409 si el correo nuevo ya es de otra cuenta', async () => {
    await api()
      .post('/api/jugadores')
      .send(
        unJugadorValido({
          correo: 'ocupado@gmail.com',
          numeroDocumento: '11223344',
        }),
      )
      .expect(201);

    await api()
      .patch('/api/cuenta')
      .set('Cookie', jugador)
      .send({ correo: 'ocupado@gmail.com' })
      .expect(409);
  });

  it('cambia la contraseña con la actual y cierra las demás sesiones', async () => {
    const otra = cookieDe(
      await iniciarSesion(
        app,
        'valeria.leon@gmail.com',
        unJugadorValido().contrasena,
      ),
    );

    await api()
      .patch('/api/cuenta/contrasena')
      .set('Cookie', jugador)
      .send({ actual: 'incorrecta1', contrasena: 'nueva2026' })
      .expect(400);
    const cambio = await api()
      .patch('/api/cuenta/contrasena')
      .set('Cookie', jugador)
      .send({ actual: unJugadorValido().contrasena, contrasena: 'nueva2026' })
      .expect(200);

    await api().get('/api/cuenta').set('Cookie', cookieDe(cambio)).expect(200);
    await api().get('/api/cuenta').set('Cookie', otra).expect(401);
    await iniciarSesion(app, 'valeria.leon@gmail.com', 'nueva2026').expect(200);
  });

  it('responde 401 sin sesión', async () => {
    await api().get('/api/cuenta').expect(401);
    await api().patch('/api/cuenta').send({ celular: '912000111' }).expect(401);
  });
});
