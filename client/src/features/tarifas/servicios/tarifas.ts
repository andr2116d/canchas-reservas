import type { TipoDeCancha } from "@/compartido/canchas/tipo-de-cancha";

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
