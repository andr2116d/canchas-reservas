import { cache } from "react";
import { consultarPaginaPrivada } from "@/compartido/sesion/consultar-pagina-privada";
import type { HorarioConsultado } from "./horario";

/** Horario de atención vigente, consultado con la sesión de quien abre la página. */
// Se consulta una sola vez por petición aunque lo pidan el horario y las tarifas.
export const consultarHorario = cache(
  (): Promise<HorarioConsultado> => consultarPaginaPrivada("horario", "No pudimos cargar el horario de atención."),
);
