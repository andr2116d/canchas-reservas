export type TipoDeBloqueo = "PROGRAMADO" | "EMERGENCIA";
export type EtapaDelBloqueo = "PROXIMO" | "EN_CURSO" | "TERMINADO";
export type Frecuencia = "DIARIA" | "SEMANAL" | "MENSUAL";

/** Un bloqueo por mantenimiento como lo devuelve la API; `fin` es el efectivo si se liberó antes. */
export interface Bloqueo {
  id: number;
  canchaId: number;
  cancha: string;
  tipo: TipoDeBloqueo;
  motivo: string;
  inicio: string;
  fin: string;
  liberado: boolean;
  etapa: EtapaDelBloqueo;
}

export interface BloqueosConsultados {
  sinTerminar: Bloqueo[];
  terminados: Bloqueo[];
}

/** Lo que se envía para bloquear: fechas `AAAA-MM-DD` y horas `HH:MM` de Lima. */
export interface PedidoDeBloqueo {
  canchaIds: number[];
  tipo: TipoDeBloqueo;
  desdeAhora: boolean;
  desdeFecha?: string;
  desdeHora?: string;
  hastaFecha: string;
  hastaHora: string;
  motivo: string;
  repeticion?: { frecuencia: Frecuencia; hasta: string };
}

/** Reserva que se cruza con un bloqueo. */
export interface ReservaCruzada {
  cancha: string;
  inicio: string;
  fin: string;
  titular: string;
}
