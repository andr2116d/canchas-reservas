import type { TipoDeCancha } from "@/compartido/canchas/tipo-de-cancha";

export const ESTADOS_DE_RESERVA = ["PENDIENTE_DE_PAGO", "PENDIENTE_DE_VALIDACION", "CONFIRMADA", "EN_JUEGO", "EXPIRADA"] as const;
export type EstadoDeReserva = (typeof ESTADOS_DE_RESERVA)[number];

/** Cómo llama el personal a cada estado: distingue lo que falta pagar de lo que falta validar. */
export const NOMBRE_DEL_ESTADO: Record<EstadoDeReserva, string> = {
  PENDIENTE_DE_PAGO: "Por pagar",
  PENDIENTE_DE_VALIDACION: "Por validar",
  CONFIRMADA: "Confirmada",
  EN_JUEGO: "En juego",
  EXPIRADA: "Expirada",
};

export type AccionDeLaAgenda = "CHECK_IN" | "MARCAR_AUSENTE" | "FINALIZAR" | "CANCELAR" | "REUBICAR";

export interface CanchaDeLaAgenda {
  id: number;
  nombre: string;
  tipo: TipoDeCancha;
}

export interface TurnoDeLaAgenda {
  codigo: string;
  estado: EstadoDeReserva;
  desde: string;
  hasta: string;
  cancha: CanchaDeLaAgenda;
  cliente: { nombre: string; celular: string | null };
  precio: string;
  adelanto: string;
  pagado: string;
  saldo: string;
  pagada: boolean;
  venceEn: string | null;
  acciones: AccionDeLaAgenda[];
}

export interface AgendaDelDia {
  fecha: string;
  hoy: string;
  ultimaFecha: string;
  ahora: string;
  proximoCambio: string | null;
  canchas: CanchaDeLaAgenda[];
  conteos: Record<EstadoDeReserva, number>;
  turnos: TurnoDeLaAgenda[];
}
