import { api } from "@/lib/api";

export type TamanoCancha = "FUTBOL_5" | "FUTBOL_7";
export type TipoCompensacion = "DEVOLUCION" | "CREDITO";

export type EstadoReserva =
  | "PENDIENTE_PAGO"
  | "PENDIENTE_VALIDACION"
  | "CONFIRMADA"
  | "EN_JUEGO"
  | "FINALIZADA"
  | "CANCELADA"
  | "EXPIRADA"
  | "AUSENTE";

export type FragmentoCancha = { id: number; nombre: string; tamano: TamanoCancha };

export type ResumenReserva = {
  cancha: FragmentoCancha;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  franja: "DIA" | "NOCHE";
  valorTurno: number;
  adelanto: number;
  saldo: number;
  creditoDisponible: number;
  minutosParaPagar: number;
  regla: { horasAnticipacion: number; tipoCompensacion: TipoCompensacion; plazoLimite: string };
};

export type ReservaCreada = {
  id: number;
  codigo: string;
  estado: EstadoReserva;
  venceEn: string | null;
};

export type ReservaJugador = {
  id: number;
  codigo: string;
  fecha: string;
  horaInicio: string;
  horaFin?: string;
  franja?: "DIA" | "NOCHE";
  estado: EstadoReserva;
  venceEn?: string | null;
  cancha?: { id: number; nombre: string; tamano?: TamanoCancha };
  valorTurno: number;
  adelantoMinimo: number;
  adelantoPagado: number;
  saldoPendiente: number;
};




export function obtenerResumenReserva(params: {
  canchaId: number;
  fecha: string;
  horaInicio: string;
}): Promise<ResumenReserva> {
  const query = new URLSearchParams({
    canchaId: String(params.canchaId),
    fecha: params.fecha,
    horaInicio: params.horaInicio,
  });
  return api<ResumenReserva>(`/reservas/resumen?${query.toString()}`);
}



export function crearReserva(datos: {
  canchaId: number;
  fecha: string;
  horaInicio: string;
  usarCredito: boolean;
}): Promise<ReservaCreada> {
  return api<ReservaCreada>("/reservas", {
    method: "POST",
    body: { ...datos },
  });
}

export function obtenerMisReservas(): Promise<ReservaJugador[]> {
  return api<ReservaJugador[]>("/reservas/mias");
}