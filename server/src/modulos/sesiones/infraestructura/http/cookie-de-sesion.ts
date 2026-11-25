import type { CookieOptions, Request, Response } from 'express';
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
    ...opcionesCookie(segura),
    expires: sesion.expiraEn,
  });
}

export function borrarCookieDeSesion(
  respuesta: Response,
  segura: boolean,
): void {
  respuesta.clearCookie(NOMBRE_COOKIE_SESION, opcionesCookie(segura));
}

function opcionesCookie(segura: boolean): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: segura,
    path: '/',
  };
}

export function leerTokenDeSesion(solicitud: Request): string | undefined {
  const valor: unknown = solicitud.cookies?.[NOMBRE_COOKIE_SESION];
  return typeof valor === 'string' ? valor : undefined;
}

/** El token de la cookie de sesión desde un encabezado `cookie` sin procesar (como el de un socket). */
export function leerTokenDeCabecera(
  cabecera: string | undefined,
): string | undefined {
  const par = cabecera
    ?.split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${NOMBRE_COOKIE_SESION}=`));
  if (!par) return undefined;
  try {
    return decodeURIComponent(par.slice(NOMBRE_COOKIE_SESION.length + 1));
  } catch {
    return undefined;
  }
}
