import { enviarJson } from "@/compartido/api/enviar-json";
import type { ResultadoEnVivo } from "@/compartido/disponibilidad/use-consulta-en-vivo";
import { aConsulta, type FiltrosDeLaAgenda } from "../utilidades/filtros";
import type { AgendaDelDia } from "./agenda";

/** La agenda de un día con sus filtros; si un filtro no sirve, dice cuál. */
export async function consultarAgenda(filtros: FiltrosDeLaAgenda, senal?: AbortSignal): Promise<ResultadoEnVivo<AgendaDelDia>> {
  const consulta = aConsulta(filtros).toString();
  const respuesta = await enviarJson<AgendaDelDia>(`/api/agenda${consulta ? `?${consulta}` : ""}`, "GET", undefined, senal);
  if (respuesta.tipo === "aceptado") return { tipo: "consultado", valor: respuesta.cuerpo };
  const primerError = respuesta.tipo === "rechazado" ? Object.values(respuesta.errores)[0] : undefined;
  return { tipo: "error", mensaje: primerError ?? respuesta.mensaje };
}
