import { consultarApiPrivada } from "@/compartido/sesion/sesion.servidor";

/** Lo que la persona ve de su propia cuenta. */
export interface Cuenta {
  nombres: string;
}

/**
 * Consulta desde el server de Next la cuenta de quien tiene la sesión iniciada,
 * reenviando sus cookies a la API. Devuelve `undefined` si no hay sesión válida.
 */
export async function obtenerCuenta(cookies: string): Promise<Cuenta | undefined> {
  if (!cookies) return undefined;
  const respuesta = await consultarApiPrivada("cuenta", cookies);
  if (!respuesta.ok) return undefined;
  return (await respuesta.json()) as Cuenta;
}
