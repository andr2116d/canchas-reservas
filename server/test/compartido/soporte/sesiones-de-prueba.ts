import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { RegistrarPersonalUseCase } from '../../../src/modulos/usuarios/aplicacion/registrar-personal.use-case';
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
