import { enviarJson, type RespuestaDeLaApi } from "@/compartido/api/enviar-json";
import type { Constancia, DatosDeLaHoja, Seguimiento } from "./libro";

/** Registra la hoja; la API la liga a la cuenta si hay sesión de jugador. */
export function registrarHoja(datos: DatosDeLaHoja): Promise<RespuestaDeLaApi<Constancia>> {
  return enviarJson<Constancia>("/api/libro-de-reclamaciones", "POST", datos);
}

/** Estado de una hoja con su número y su código de seguimiento. */
export function seguirHoja(numero: string, codigo: string): Promise<RespuestaDeLaApi<Seguimiento>> {
  return enviarJson<Seguimiento>("/api/libro-de-reclamaciones/seguimiento", "POST", { numero, codigo });
}
