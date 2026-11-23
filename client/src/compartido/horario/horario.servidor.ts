import { consultarPaginaPrivada } from "@/compartido/sesion/consultar-pagina-privada";
import type { HorarioConsultado } from "./horario";

/** Horario de atención vigente, consultado con la sesión de quien abre la página. */
export function consultarHorario(): Promise<HorarioConsultado> {
  return consultarPaginaPrivada("horario", "No pudimos cargar el horario de atención.");
}
