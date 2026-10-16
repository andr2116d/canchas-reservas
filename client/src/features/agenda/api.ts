import { api } from "@/lib/api";

export type TamanoCancha = "FUTBOL_5" | "FUTBOL_7";

export type EstadoReserva =
  | "PENDIENTE_PAGO"
  | "PENDIENTE_VALIDACION"
  | "CONFIRMADA"
  | "EN_JUEGO"
  | "FINALIZADA"
  | "CANCELADA"
  | "EXPIRADA"
  | "AUSENTE";

export type TurnoAgenda = {
  id: number;
  codigo: string;
  horaInicio: string;
  horaFin: string;
  franja: "DIA" | "NOCHE";
  cancha: { id: number; nombre: string; tamano: TamanoCancha };
  cliente: { id: number; nombre: string; telefono: string };
  estado: EstadoReserva;
  valorTurno: number;
  adelantoMinimo: number;
  adelantoPagado: number;
  saldoPendiente: number;
  acciones: string[];
};

function construirQuery(fecha: string, canchaId?: string, estado?: string): string {
  const params = new URLSearchParams({ fecha });
  if (canchaId) params.set("canchaId", canchaId);
  if (estado) params.set("estado", estado);
  return `/agenda?${params.toString()}`;
}

export function obtenerAgenda(
  fecha: string,
  canchaId?: string,
  estado?: string,
): Promise<TurnoAgenda[]> {
  return api<TurnoAgenda[]>(construirQuery(fecha, canchaId, estado));
}

export type MetodoConfirmacion = "YAPE" | "PLIN" | "TRANSFERENCIA" | "EFECTIVO";

export type DatosConfirmarPago = {
  metodo: MetodoConfirmacion;
  pagoCompleto: boolean;
  numeroOperacion?: string;
};

export type PagoConfirmado = {
  id: number;
  codigo: string;
  estado: EstadoReserva;
  adelantoPagado: number;
  saldoPendiente: number;
};

export function confirmarPago(id: number, datos: DatosConfirmarPago): Promise<PagoConfirmado> {
  return api<PagoConfirmado>(`/agenda/${id}/confirmar-pago`, { method: "POST", body: datos });
}
