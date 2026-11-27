import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { RegistrarPersonalUseCase } from '../../../src/modulos/usuarios/aplicacion/registrar-personal.use-case';
import { unaRecepcionistaValida } from '../../usuarios/fabricas/datos-recepcionista';
import { unJugadorValido } from '../../usuarios/fabricas/datos-registro-jugador';
import { cookieDe } from './cookie-de-sesion';

export const CONTRASENA_TEMPORAL = 'temporal2026';
export const CONTRASENA_DEFINITIVA = 'definitiva2026';

function iniciar(
  app: NestExpressApplication,
  correo: string,
  contrasena: string,
) {
  return request(app.getHttpServer())
    .post('/api/sesiones')
    .send({ correo, contrasena });
}

/** Crea un administrador, inicia su sesión y cambia la contraseña temporal. */
export async function sesionDeAdministrador(
  app: NestExpressApplication,
  correo = 'administracion@laprevia.pe',
): Promise<string> {
  await app.get(RegistrarPersonalUseCase).ejecutar(
    {
      nombres: 'Valeria',
      apellidos: 'León Paredes',
      correo,
      contrasena: CONTRASENA_TEMPORAL,
    },
    'ADMINISTRADOR',
  );
  await confirmarDatosDelPersonal(app);
  const temporal = cookieDe(await iniciar(app, correo, CONTRASENA_TEMPORAL));
  const cambio = await request(app.getHttpServer())
    .patch('/api/sesiones/contrasena-temporal')
    .set('Cookie', temporal)
    .send({ contrasena: CONTRASENA_DEFINITIVA });
  return cookieDe(cambio);
}

/** Un administrador recién creado, sin datos confirmados, con la cookie de su primera sesión. */
export async function administradorSinDatos(
  app: NestExpressApplication,
  correo = 'jefa@laprevia.pe',
): Promise<string> {
  await app.get(RegistrarPersonalUseCase).ejecutar(
    {
      nombres: 'Vale',
      apellidos: 'León',
      correo,
      contrasena: CONTRASENA_TEMPORAL,
    },
    'ADMINISTRADOR',
  );
  return cookieDe(await iniciar(app, correo, CONTRASENA_TEMPORAL));
}

/**
 * Marca como confirmados los datos del personal creado en la prueba, para que entre
 * directo a su panel. El primer ingreso con datos se prueba aparte.
 */
export async function confirmarDatosDelPersonal(
  app: NestExpressApplication,
): Promise<void> {
  await app.get(PrismaService).usuario.updateMany({
    where: { rol: { not: 'JUGADOR' }, datosConfirmadosEn: null },
    data: { datosConfirmadosEn: new Date() },
  });
}

/** Registra un jugador y devuelve la cookie de la sesión que abre el registro. */
export async function sesionDeJugador(
  app: NestExpressApplication,
): Promise<string> {
  const registro = await request(app.getHttpServer())
    .post('/api/jugadores')
    .send(unJugadorValido());
  return cookieDe(registro);
}

/** Inicia sesión con un correo y una contraseña y devuelve la respuesta. */
export function iniciarSesion(
  app: NestExpressApplication,
  correo: string,
  contrasena: string,
) {
  return iniciar(app, correo, contrasena);
}

/** Administración crea a Rosa Quispe y ella entra con su temporal, dejando el cambio para después. */
export async function sesionDeRecepcionista(
  app: NestExpressApplication,
  administrador: string,
): Promise<string> {
  await request(app.getHttpServer())
    .post('/api/recepcionistas')
    .set('Cookie', administrador)
    .send(unaRecepcionistaValida())
    .expect(201);
  await confirmarDatosDelPersonal(app);
  const sesion = cookieDe(
    await iniciar(app, 'rosa.quispe@laprevia.pe', CONTRASENA_TEMPORAL),
  );
  await request(app.getHttpServer())
    .post('/api/sesiones/actual/cambio-omitido')
    .set('Cookie', sesion)
    .expect(204);
  return sesion;
}
