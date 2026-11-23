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

export interface Tramo {
  franja: "DIA" | "NOCHE";
  desde: string;
  hasta: string;
  monto: string;
}

export interface TurnoConPrecio {
  desde: string;
  hasta: string;
  /** Rato final del día ofrecido aunque no alcance para un turno completo. */
  corto: boolean;
  total: string;
  tramos: Tramo[];
}

/** Turnos de un tipo de cancha en un día, o por qué no hay. */
export type TurnosConsultados =
  | { estado: "SIN_HORARIO" | "CERRADO" }
  | {
      estado: "ABIERTO";
      duracionDelTurnoHoras: number;
      inicioDeLaNoche: string;
      turnos: TurnoConPrecio[];
      sinTurno?: { desde: string; hasta: string };
    };
