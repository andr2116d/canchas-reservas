import type { TipoDeCancha } from "@/compartido/canchas/tipo-de-cancha";
import type { Caracteristica } from "@/compartido/canchas/caracteristicas";

export { CARACTERISTICAS, TEXTO_DE_CARACTERISTICA, type Caracteristica } from "@/compartido/canchas/caracteristicas";

/** Lo que se envía al crear o editar una cancha. */
export interface DatosDeCancha {
  nombre: string;
  tipo: TipoDeCancha;
  tieneIluminacion: boolean;
  caracteristicas: Caracteristica[];
  nota?: string;
}

/** Una cancha como la devuelve la API. */
export interface Cancha extends Required<Omit<DatosDeCancha, "nota">> {
  id: number;
  nota: string | null;
  estado: "OPERATIVA" | "DESACTIVADA";
  /** Solo si nunca tuvo reservas. */
  sePuedeEliminar: boolean;
  /** Bloqueo por mantenimiento en curso; solo viene en la lista. */
  mantenimiento?: { hasta: string; tipo: "PROGRAMADO" | "EMERGENCIA" } | null;
  /** El siguiente bloqueo que aún no empieza; solo viene en la lista. */
  proximoMantenimiento?: { inicio: string; fin: string } | null;
}

export type AccionSobreCancha =
  | "ALTA"
  | "EDICION"
  | "DESACTIVACION"
  | "REACTIVACION"
  | "ELIMINACION"
  | "BLOQUEO"
  | "LIBERACION_DE_BLOQUEO"
  | "RETIRO_DE_BLOQUEO";

export interface CambioDeCancha {
  accion: AccionSobreCancha;
  nombreDeLaCancha: string;
  ejecutadoPor: string;
  ocurridoEn: string;
}

/** Reserva que impide desactivar una cancha o cambiar su tamaño o su luz. */
export interface ReservaAfectada {
  inicio: string;
  fin: string;
  titular: string;
}
