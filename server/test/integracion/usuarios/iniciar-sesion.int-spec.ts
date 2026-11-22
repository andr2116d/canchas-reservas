import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import {
  CONFIGURACION,
  leerConfiguracion,
} from '../../../src/compartido/infraestructura/configuracion/configuracion';
import type { RolUsuario } from '../../../src/compartido/dominio/rol-usuario';
import { RegistrarPersonalUseCase } from '../../../src/modulos/usuarios/aplicacion/registrar-personal.use-case';
import { unJugadorValido } from '../../fabricas/datos-registro-jugador';
import { cookieDe } from '../../soporte/cookie-de-sesion';
import { crearAppDePrueba } from '../../soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../soporte/limpiar-tablas';

const DOMINIO = 'empresa.test';
const CONTACTO = { correo: 'jugador@externo.test', contrasena: 'temporal2026' };
const CONTRASENA_NUEVA = 'definitiva2026';
const PERSONAL = {
  nombres: 'Valeria',
  apellidos: 'León Paredes',
  contrasena: CONTACTO.contrasena,
};

describe('Inicio de sesión y autorización por rol', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba((modulo) =>
      modulo
        .overrideProvider(CONFIGURACION)
        .useValue(
          leerConfiguracion({ ...process.env, DOMINIO_CORPORATIVO: DOMINIO }),
        ),
    ));
    await limpiarTablas(prisma);
  });
  afterEach(() => app.close());

  function api() {
    return request(app.getHttpServer());
  }

  function iniciar(correo = CONTACTO.correo, contrasena = CONTACTO.contrasena) {
    return api().post('/api/sesiones').send({ correo, contrasena });
  }

  async function crearJugador() {
    await api()
      .post('/api/jugadores')
      .send(unJugadorValido(CONTACTO))
      .expect(201);
  }

  async function crearPersonal(rol: Exclude<RolUsuario, 'JUGADOR'>) {
    const dominio = rol === 'ADMINISTRADOR' ? DOMINIO : 'externo.test';
    const correo = rol.toLowerCase() + '@' + dominio;
    await app
      .get(RegistrarPersonalUseCase)
      .ejecutar({ ...PERSONAL, correo }, rol);
    return correo;
  }

  function cambiarContrasena(cookie: string, contrasena = CONTRASENA_NUEVA) {
    return api()
      .patch('/api/sesiones/contrasena-temporal')
      .set('Cookie', cookie)
      .send({ contrasena });
  }

  it('abre una sesión de jugador, emite solo su destino y registra el usuario y la hora', async () => {
    await crearJugador();
    const usuario = await prisma.usuario.findFirstOrThrow();
    const antes = new Date();

    const respuesta = await iniciar(' JUGADOR@EXTERNO.TEST ');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      rol: 'JUGADOR',
      requiereCambiarContrasena: false,
    });
    expect(respuesta.headers['set-cookie'][0]).toMatch(
      /HttpOnly.*SameSite=Lax/,
    );
    expect(respuesta.headers['cache-control']).toBe('no-store');
    const accesos = await prisma.registroAcceso.findMany({
      orderBy: { id: 'asc' },
    });
    expect(accesos).toHaveLength(2);
    expect(accesos[1].usuarioId).toBe(usuario.id);
    expect(accesos[1].ocurridoEn.getTime()).toBeGreaterThanOrEqual(
      antes.getTime(),
    );
  });

  it('responde igual cuando el correo es desconocido o la contraseña es incorrecta', async () => {
    await crearJugador();

    const inexistente = await iniciar('desconocido@externo.test');
    const incorrecta = await iniciar(CONTACTO.correo, 'otra2026');

    expect([inexistente.status, incorrecta.status]).toEqual([401, 401]);
    expect(inexistente.body).toEqual({
      mensaje: 'Correo o contraseña incorrectos.',
      errores: {},
    });
    expect(incorrecta.body).toEqual(inexistente.body);
    expect(incorrecta.headers['set-cookie']).toBeUndefined();
    expect(await prisma.registroAcceso.count()).toBe(1);
  });

  it('informa cuenta inactiva tras verificar la contraseña y revoca el acceso de sesiones anteriores', async () => {
    await crearJugador();
    const cookie = cookieDe(await iniciar());
    await prisma.usuario.updateMany({ data: { estado: 'INACTIVO' } });

    await iniciar(CONTACTO.correo, 'incorrecta1').expect(401);
    const bloqueada = await iniciar().expect(403);

    expect(bloqueada.body.mensaje).toContain('inactiva');
    expect(bloqueada.headers['set-cookie']).toBeUndefined();
    await api().get('/api/cuenta').set('Cookie', cookie).expect(401);
  });

  it('exige el dominio exacto del administrador tanto en el alta como en el acceso', async () => {
    await expect(
      app
        .get(RegistrarPersonalUseCase)
        .ejecutar(
          { ...PERSONAL, correo: 'persona@sub.' + DOMINIO },
          'ADMINISTRADOR',
        ),
    ).rejects.toMatchObject({ errores: { correo: expect.any(String) } });

    await crearJugador();
    await prisma.usuario.updateMany({ data: { rol: 'ADMINISTRADOR' } });
    await iniciar().expect(401);
    expect(await prisma.registroAcceso.count()).toBe(1);
  });

  it.each([
    ['ADMINISTRADOR', '/api/paneles/administracion', '/api/paneles/recepcion'],
    ['RECEPCIONISTA', '/api/paneles/recepcion', '/api/paneles/administracion'],
  ] as const)(
    'restringe la primera sesión de %s y rota su token al cambiar la contraseña',
    async (rol, panel, panelAjeno) => {
      const correo = await crearPersonal(rol);
      const inicio = await iniciar(correo).expect(200);
      expect(inicio.body).toEqual({ rol, requiereCambiarContrasena: true });
      const temporal = cookieDe(inicio);
      const otroTemporal = cookieDe(await iniciar(correo));
      await api().get(panel).set('Cookie', temporal).expect(403);
      await api().get('/api/cuenta').set('Cookie', temporal).expect(403);
      await cambiarContrasena(temporal, CONTACTO.contrasena).expect(400);
      const cambio = await cambiarContrasena(temporal).expect(200);
      const renovada = cookieDe(cambio);

      expect(renovada).not.toBe(temporal);
      expect(cambio.body).toEqual({ rol, requiereCambiarContrasena: false });
      await api().get(panel).set('Cookie', renovada).expect(200);
      const rechazo = await api()
        .get(panelAjeno)
        .set('Cookie', renovada)
        .expect(403);
      expect(rechazo.body).toEqual({
        mensaje: 'No tienes permiso para hacer esto.',
        errores: {},
      });
      await api().get(panel).set('Cookie', temporal).expect(401);
      await api().get(panel).set('Cookie', otroTemporal).expect(401);
      await cambiarContrasena(renovada).expect(403);
      await iniciar(correo).expect(401);
      await iniciar(correo, CONTRASENA_NUEVA).expect(200);
      expect(await prisma.registroAcceso.count()).toBe(3);
    },
  );

  it('acepta una sola renovación cuando se envían dos cambios a la vez', async () => {
    const correo = await crearPersonal('ADMINISTRADOR');
    const cookie = cookieDe(await iniciar(correo));

    const cambios = await Promise.all([
      cambiarContrasena(cookie, 'alternativa11'),
      cambiarContrasena(cookie, 'alternativa22'),
    ]);

    expect(cambios.map((cambio) => cambio.status)).toEqual(expect.arrayContaining([200, 401]));
    expect(await prisma.sesion.count()).toBe(1);
  });

  it('restringe el alta de recepcionistas al administrador que completó su primer acceso', async () => {
    await crearJugador();
    const jugador = cookieDe(await iniciar());
    const correo = await crearPersonal('ADMINISTRADOR');
    const temporal = cookieDe(await iniciar(correo));
    const alta = { ...PERSONAL, correo: 'recepcion@afuera.test' };
    const crear = () => api().post('/api/recepcionistas').send(alta);

    await crear().expect(401);
    await crear().set('Cookie', jugador).expect(403);
    await crear().set('Cookie', temporal).expect(403);
    const completa = cookieDe(await cambiarContrasena(temporal));
    await crear().set('Cookie', completa).expect(201);

    const nueva = await iniciar(alta.correo).expect(200);
    expect(nueva.body).toEqual({
      rol: 'RECEPCIONISTA',
      requiereCambiarContrasena: true,
    });
    const registrada = await prisma.usuario.findFirstOrThrow({
      where: { rol: 'RECEPCIONISTA' },
    });
    expect(registrada.correoCifrado).not.toContain(alta.correo);
    expect(registrada.documentoHash).toBeNull();
    await crear().set('Cookie', completa).expect(409);
  });

  it('rechaza roles inyectados en el inicio y en el registro público', async () => {
    await api()
      .post('/api/sesiones')
      .send({ ...CONTACTO, rol: 'ADMINISTRADOR' })
      .expect(400);
    await api()
      .post('/api/jugadores')
      .send({ ...unJugadorValido(), rol: 'ADMINISTRADOR' })
      .expect(400);
    expect(await prisma.usuario.count()).toBe(0);
  });

  it('deniega cookies alteradas y revoca la sesión de la cookie al salir', async () => {
    await crearJugador();
    const cookie = cookieDe(await iniciar());
    const alterada = cookie + 'a';
    const hash = (
      await prisma.sesion.findFirstOrThrow({ orderBy: { id: 'desc' } })
    ).tokenHash;

    await api().get('/api/cuenta').set('Cookie', alterada).expect(401);
    await api()
      .get('/api/cuenta')
      .set('Cookie', 'sesion=' + hash)
      .expect(401);
    await api()
      .get('/api/cuenta')
      .set('Authorization', 'Bearer ' + cookie.split('=')[1])
      .expect(401);
    await api().get('/api/paneles/recepcion').set('Cookie', cookie).expect(403);
    await api()
      .get('/api/paneles/administracion')
      .set('Cookie', cookie)
      .expect(403);
    const cierre = await api()
      .delete('/api/sesiones/actual')
      .set('Cookie', cookie)
      .expect(204);
    expect(cierre.headers['set-cookie'][0]).toMatch(/^sesion=;/);
    await api().get('/api/cuenta').set('Cookie', cookie).expect(401);
    await api()
      .delete('/api/sesiones/actual')
      .set('Cookie', cookie)
      .expect(204);
  });

  it('limita intentos por correo normalizado incluso desde IP distintas', async () => {
    for (let intento = 0; intento < 8; intento++) {
      await iniciar()
        .set('X-Forwarded-For', '192.0.2.' + (intento + 1))
        .expect(401);
    }

    const bloqueo = await iniciar(' JUGADOR@EXTERNO.TEST ')
      .set('X-Forwarded-For', '192.0.2.23')
      .expect(429);

    expect(Number(bloqueo.headers['retry-after'])).toBeGreaterThan(0);
    expect(bloqueo.headers['set-cookie']).toBeUndefined();
  });

  it('limita intentos por IP aunque cambie el correo', async () => {
    for (let intento = 0; intento < 20; intento++) {
      await iniciar('prueba' + intento + '@externo.test').expect(401);
    }

    await iniciar('ultimo@externo.test').expect(429);
  });

  it('rechaza un inicio solicitado desde otro sitio', async () => {
    await crearJugador();
    const rechazo = await iniciar()
      .set('Origin', 'https://externo.test')
      .set('Sec-Fetch-Site', 'cross-site');

    expect(rechazo.status).toBe(403);
    expect(rechazo.headers['set-cookie']).toBeUndefined();
    expect(await prisma.registroAcceso.count()).toBe(1);
  });
});
