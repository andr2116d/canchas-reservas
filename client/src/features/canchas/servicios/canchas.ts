import type { TipoDeCancha } from "@/compartido/canchas/tipo-de-cancha";

export type Caracteristica = "TECHADA" | "BANCAS" | "JUNTO_A_LA_PARED" | "GRADERIAS" | "MALLA_ALTA" | "VESTUARIO_CERCA";

/** Detalles que se pueden marcar, en el orden en que se muestran. */
export const CARACTERISTICAS: { valor: Caracteristica; texto: string }[] = [
  { valor: "TECHADA", texto: "Techada" },
  { valor: "BANCAS", texto: "Bancas" },
  { valor: "JUNTO_A_LA_PARED", texto: "Junto a la pared" },
  { valor: "GRADERIAS", texto: "Graderías" },
  { valor: "MALLA_ALTA", texto: "Malla alta" },
  { valor: "VESTUARIO_CERCA", texto: "Vestuario cerca" },
];

export const TEXTO_DE_CARACTERISTICA = Object.fromEntries(
  CARACTERISTICAS.map(({ valor, texto }) => [valor, texto]),
) as Record<Caracteristica, string>;

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
}

export type AccionSobreCancha = "ALTA" | "EDICION" | "DESACTIVACION" | "REACTIVACION" | "ELIMINACION";

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
