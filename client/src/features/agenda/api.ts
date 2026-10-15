import { api } from "@/lib/api";
import { hoyEnLima } from "@/lib/formato";


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
  if (process.env.NODE_ENV === "development") {
    if (fecha !== hoyEnLima()) {
      return Promise.resolve([]);
    }
  }
  return api<TurnoAgenda[]>(construirQuery(fecha, canchaId, estado));
}
