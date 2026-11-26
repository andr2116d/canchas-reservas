import { consultarApiPrivada } from "@/compartido/sesion/sesion.servidor";

import type { Rol } from "@/compartido/sesion/destino-de-sesion";

export type DatoEditable = "nombres" | "apellidos" | "fechaNacimiento" | "correo" | "celular" | "dorsal";

/** Lo que la persona ve de su propia cuenta y lo que puede cambiar. */
export interface Cuenta {
  id: number;
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
  /** El personal puede pasar una vez de DNI a carné de extranjería o al revés. */
  puedeCambiarTipoDeDocumento: boolean;
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

/** Lo que ya se sabe del personal en su primer ingreso, para que lo confirme o lo complete. */
export async function obtenerDatosParaConfirmar(cookies: string): Promise<Cuenta | undefined> {
  const respuesta = await consultarApiPrivada("cuenta/datos", cookies);
  if (!respuesta.ok) return undefined;
  return (await respuesta.json()) as Cuenta;
}
