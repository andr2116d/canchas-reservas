import type { Request, Response } from 'express';
import type { SesionAbierta } from '../../aplicacion/abrir-sesion.use-case';

const NOMBRE_COOKIE_SESION = 'sesion';

/**
 * Entrega el token en una cookie que JavaScript no puede leer (httpOnly),
 * que no viaja en envíos desde otros sitios (SameSite=Lax) y que en producción
 * solo viaja por HTTPS (Secure).
 */
export function escribirCookieDeSesion(
  respuesta: Response,
  sesion: SesionAbierta,
  segura: boolean,
): void {
  respuesta.cookie(NOMBRE_COOKIE_SESION, sesion.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: segura,
    path: '/',
    expires: sesion.expiraEn,
  });
}

export function leerTokenDeSesion(solicitud: Request): string | undefined {
  const valor: unknown = solicitud.cookies?.[NOMBRE_COOKIE_SESION];
  return typeof valor === 'string' ? valor : undefined;
}
