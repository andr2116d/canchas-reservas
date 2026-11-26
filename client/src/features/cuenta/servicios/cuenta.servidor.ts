import { consultarApiPrivada } from "@/compartido/sesion/sesion.servidor";

/** Una sesión abierta de la propia cuenta. */
export interface SesionDeLaCuenta {
  id: number;
  dispositivo: string | null;
  abiertaEn: string;
  ultimaActividadEn: string;
  actual: boolean;
}

async function consultar<T>(ruta: string, cookie: string): Promise<T[]> {
  const respuesta = await consultarApiPrivada(ruta, cookie);
  return respuesta.ok ? ((await respuesta.json()) as T[]) : [];
}

/** Las sesiones abiertas de quien consulta; vacío si no se pudieron leer. */
export const obtenerMisSesiones = (cookie: string) => consultar<SesionDeLaCuenta>("cuenta/sesiones", cookie);

/** Los últimos inicios de sesión de quien consulta. */
export const obtenerMisAccesos = (cookie: string) => consultar<{ ocurridoEn: string }>("cuenta/accesos", cookie);
