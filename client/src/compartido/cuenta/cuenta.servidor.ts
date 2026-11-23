import { consultarApiPrivada } from "@/compartido/sesion/sesion.servidor";

import type { Rol } from "@/compartido/sesion/destino-de-sesion";

export type DatoEditable = "correo" | "celular" | "dorsal";

/** Lo que la persona ve de su propia cuenta y lo que puede cambiar. */
export interface Cuenta {
  rol: Rol;
  nombres: string;
  apellidos: string;
  tipoDocumento?: "DNI" | "CARNE_EXTRANJERIA";
  numeroDocumento?: string;
  fechaNacimiento?: string;
  correo: string;
  celular?: string;
  dorsal?: number;
  editables: DatoEditable[];
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
