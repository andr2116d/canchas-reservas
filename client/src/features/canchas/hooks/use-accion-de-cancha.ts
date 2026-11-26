import { useAccionConAviso } from "@/compartido/ui/use-accion-con-aviso";
import type { ReservaAfectada } from "../servicios/canchas";

/** Cambiar el estado de una cancha o de un bloqueo; las reservas por jugar pueden impedirlo. */
export const useAccionDeCancha = () => useAccionConAviso<{ tipo: "bloqueada"; mensaje: string; reservas: ReservaAfectada[] }>();
