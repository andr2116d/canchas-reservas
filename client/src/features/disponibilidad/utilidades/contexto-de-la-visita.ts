import type { DestinoDeSesion } from "@/compartido/sesion/destino-de-sesion";
import type { ContextoDelMapa } from "../componentes/tu-turno";

/** El mapa de la portada: con la sesión de un jugador deja reservar; si no, invita a ingresar. */
export function contextoDeLaVisita(sesion?: Pick<DestinoDeSesion, "rol">): ContextoDelMapa {
  return sesion?.rol === "JUGADOR" ? "jugador" : "publico";
}
