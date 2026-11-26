export function cookieDeSesion(cabeceras: Record<string, unknown>): string {
  const cookies = (cabeceras['set-cookie'] as string[] | undefined) ?? [];
  const cookie = cookies.find((valor) => valor.startsWith('sesion='));
  if (!cookie) throw new Error('La respuesta no trae la cookie de sesión.');
  return cookie;
}

export function cookieDe(respuesta: { headers: Record<string, unknown> }): string {
  return cookieDeSesion(respuesta.headers).split(';')[0];
}
