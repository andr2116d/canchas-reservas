import type { CookieOptions } from 'express';
import type { Rol } from '../../generated/prisma/enums';

export const COOKIE_SESION = 'sesion';
export const DURACION_SESION_MS = 15 * 60 * 1000;

export function opcionesCookieSesion(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}

export function opcionesRenovarCookie(): CookieOptions {
  return { ...opcionesCookieSesion(), maxAge: DURACION_SESION_MS };
}

export function crearPayloadSesion(id: number, rol: Rol) {
  return { sub: String(id), rol };
}
