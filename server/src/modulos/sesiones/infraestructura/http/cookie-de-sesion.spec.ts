import type { Request, Response } from 'express';
import {
  escribirCookieDeSesion,
  leerTokenDeSesion,
  leerTokenDeCabecera,
} from './cookie-de-sesion';

function respuestaQueGuardaLaCookie() {
  const guardada: { nombre?: string; valor?: string; opciones?: object } = {};
  const respuesta = {
    cookie(nombre: string, valor: string, opciones: object) {
      Object.assign(guardada, { nombre, valor, opciones });
    },
  } as unknown as Response;
  return { respuesta, guardada };
}

const SESION = { token: 'token-1', expiraEn: new Date('2026-11-22T18:00:00Z') };

describe('cookie de sesión', () => {
  it('se escribe httpOnly, SameSite=Lax y con el vencimiento de la sesión', () => {
    const { respuesta, guardada } = respuestaQueGuardaLaCookie();

    escribirCookieDeSesion(respuesta, SESION, true);

    expect(guardada).toEqual({
      nombre: 'sesion',
      valor: 'token-1',
      opciones: {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        expires: SESION.expiraEn,
      },
    });
  });

  it('solo omite Secure cuando la configuración lo permite (desarrollo)', () => {
    const { respuesta, guardada } = respuestaQueGuardaLaCookie();

    escribirCookieDeSesion(respuesta, SESION, false);

    expect(guardada.opciones).toMatchObject({ secure: false });
  });

  it('lee el token de la cookie, o nada si no viene', () => {
    expect(
      leerTokenDeSesion({
        cookies: { sesion: 'token-1' },
      } as unknown as Request),
    ).toBe('token-1');
    expect(leerTokenDeSesion({ cookies: {} } as Request)).toBeUndefined();
    expect(leerTokenDeSesion({} as Request)).toBeUndefined();
  });

  it('lee el token del encabezado cookie de un socket, entre otras cookies', () => {
    expect(
      leerTokenDeCabecera(
        'preferencia_de_cookies=todas; sesion=abc123; otra=1',
      ),
    ).toBe('abc123');
    expect(leerTokenDeCabecera('sesion=a%2Bb')).toBe('a+b');
    expect(leerTokenDeCabecera('otra=1')).toBeUndefined();
    expect(leerTokenDeCabecera(undefined)).toBeUndefined();
    expect(leerTokenDeCabecera('sesion=%E0%A4%A')).toBeUndefined();
  });
});
