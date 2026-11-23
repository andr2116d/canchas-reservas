export type TipoDeCancha = "FUTBOL_5" | "FUTBOL_7";

export const TIPOS_DE_CANCHA: TipoDeCancha[] = ["FUTBOL_5", "FUTBOL_7"];

export const NOMBRE_DEL_TIPO: Record<TipoDeCancha, string> = {
  FUTBOL_5: "Fútbol 5",
  FUTBOL_7: "Fútbol 7",
};

/** Una versión guardada de la tarifa, con montos en soles y dos decimales. */
export interface VistaDeTarifa {
  precioDia: string;
  precioNoche: string;
  duracionDelTurnoHoras: number;
  ofreceTurnoCorto: boolean;
  guardadaEn: string;
  guardadaPor: string;
}

export interface TarifaDelTipo {
  tipo: TipoDeCancha;
  /** Falta si el tipo todavía no tiene tarifa. */
  vigente?: VistaDeTarifa;
  /** De la más reciente a la más antigua. */
  historial: VistaDeTarifa[];
}

export interface TarifasVigentes {
  tarifas: TarifaDelTipo[];
}
